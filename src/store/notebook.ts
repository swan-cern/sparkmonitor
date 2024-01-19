import { makeAutoObservable } from 'mobx';
import { SparkStage } from './spark-stage';
import { SparkJob } from './spark-job';
import { Cell } from './cell';

export class NotebookStore {
  numExecutors?: number;
  numTotalCores?: number;
  applicationName?: string;
  applicationId?: string;
  applicationAttemptId?: string;
  uniqueId = 'default-key';
  hideAllDisplays = false;

  cells: { [cellId: string]: Cell } = {};
  jobs: { [jobId: string]: SparkJob } = {};
  stages: { [stageId: string]: SparkStage } = {};

  constructor(public notebookPanelId: string) {
    makeAutoObservable(this);
  }

  toggleHideAllDisplays() {
    this.hideAllDisplays = !this.hideAllDisplays;
  }

  onSparkApplicationStart(data: any) {
    this.applicationId = data.appId;
    this.applicationName = data.appName;
    this.applicationAttemptId = data.appAttemptId;
    this.uniqueId = `app${this.applicationId}-attempt${this.applicationAttemptId}`;
  }

  private deleteCellData(cellId: string) {
    const cell = this.cells[cellId];
    if (cell) {
      cell.uniqueJobIds.forEach(uniqueJobId => {
        const job = this.jobs[uniqueJobId];
        if (job) {
          job.uniqueStageIds.forEach(uniqueStageId => {
            const stage = this.stages[uniqueStageId];
            if (stage) {
              delete this.stages[uniqueStageId];
            }
          });
          delete this.jobs[uniqueJobId];
        }
      });
      delete this.cells[cellId];
    }
  }

  onCellRemoved(cellId: string) {
    this.deleteCellData(cellId);
  }

  onCellExecutedAgain(cellId: string) {
    this.deleteCellData(cellId);
    this.cells[cellId] = new Cell(cellId, this);
  }

  onSparkJobStart(cellId: string, data: any) {
    // These values are set here as previous messages may
    // be missed if reconnecting from a browser reload.
    this.numTotalCores = data.totalCores;
    this.numExecutors = data.numExecutors;

    const job = new SparkJob(this);
    job.uniqueId = `${this.uniqueId}-job-${data.jobId}`;
    job.jobId = data.jobId;
    job.status = data.status;
    job.cellId = cellId;
    job.name = String(data.name).split(' ')[0];
    job.startTime = new Date(data.submissionTime);
    job.stageIds = data.stageIds;
    job.numStages = data.stageIds.length;
    job.numTasks = data.numTasks;

    data.stageIds.forEach((stageId: string) => {
      const uniqueStageId = `${this.uniqueId}-stage-${stageId}`;
      let stage = this.stages[uniqueStageId];
      if (!stage) {
        stage = new SparkStage();
        stage.status = 'PENDING';
        this.stages[uniqueStageId] = stage;
      }
      stage.uniqueJobId = job.uniqueId;
      stage.numTasks = data.stageInfos[stageId].numTasks;
      stage.name = data.stageInfos[stageId].name;
      job.uniqueStageIds.push(uniqueStageId);
    });
    job.uniqueStageIds.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    if (job.name === 'null') {
      const lastStageId = Math.max.apply(null, data.stageIds);
      job.name = this.stages[`${this.uniqueId}-stage-${lastStageId}`].name;
    }

    if (!this.cells[cellId]) {
      this.cells[cellId] = new Cell(cellId, this);
    }
    this.cells[cellId].uniqueJobIds.push(job.uniqueId);
    job.cell = this.cells[cellId];
    job.cell.taskChartStore.onSparkJobStart(data);
    this.jobs[job.uniqueId] = job;
  }

  onSparkJobEnd(data: any) {
    const uniqueId = `${this.uniqueId}-job-${data.jobId}`;
    const job = this.jobs[uniqueId];
    if (job) {
      job.status = data.status;
      job.endTime = new Date(data.completionTime);
      job.uniqueStageIds.forEach(uniqueStageId => {
        if (this.stages[uniqueStageId]?.status === 'PENDING') {
          this.stages[uniqueStageId].status = 'SKIPPED';
          job.numTasks -= this.stages[uniqueStageId].numTasks;
        }
      });
      job.cell?.taskChartStore.onSparkJobEnd(data);
    } else {
      console.warn('SparkMonitor: Could not identify job');
    }
  }

  onSparkStageSubmitted(cellId: string, data: any) {
    const submissionTime =
      data.submissionTime === -1 ? new Date() : new Date(data.submissionTime);
    const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
    if (!this.stages[uniqueStageId]) {
      this.stages[uniqueStageId] = new SparkStage();
      this.stages[uniqueStageId].uniqueId = uniqueStageId;
    }
    const stage = this.stages[uniqueStageId];
    stage.cellId = cellId;
    stage.stageId = data.stageId;
    stage.status = 'RUNNING';
    stage.name = String(data.name).split(' ')[0];
    stage.submissionTime = submissionTime;
    stage.numTasks = data.numTasks;
  }

  onSparkStageCompleted(data: any) {
    const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
    const stage = this.stages[uniqueStageId];
    if (stage) {
      stage.status = data.status;
      stage.completionTime = new Date(data.completionTime);
      stage.submissionTime = new Date(data.submissionTime);
      stage.numActiveTasks = 0;
      stage.numCompletedTasks = data.numCompletedTasks;
      stage.numFailedTasks = data.numFailedTasks;
      stage.numTasks = data.numTasks;

      const job = this.jobs[stage.uniqueJobId];
      if (job) {
        job.numActiveTasks = 0;
        job.numCompletedTasks = 0;
        job.numFailedTasks = 0;
        job.numTasks = 0;

        // Update active/completed/failed tasks number (scan all job stages tasks stats)
        job.uniqueStageIds.forEach(uniqueStageId => {
          job.numActiveTasks += this.stages[uniqueStageId]?.numActiveTasks || 0;
          job.numCompletedTasks +=
            this.stages[uniqueStageId]?.numCompletedTasks || 0;
          job.numFailedTasks += this.stages[uniqueStageId]?.numFailedTasks || 0;
          job.numTasks += this.stages[uniqueStageId]?.numTasks || 0;
        });
      }
    } else {
      console.warn('SparkMonitor: Unable to identify stage');
    }
  }

  onSparkExecutorAdded(data: any) {
    this.numTotalCores = data.totalCores;
    if (!this.numExecutors) {
      this.numExecutors = 0;
    }
    this.numExecutors += 1;
  }

  onSparkExecutorRemoved(data: any) {
    this.numTotalCores = data.totalCores;
    if (!this.numExecutors) {
      this.numExecutors = 0;
    }
    this.numExecutors -= 1;
  }

  onSparkTaskStart(data: any) {
    const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
    const stage = this.stages[uniqueStageId];
    if (stage) {
      const uniqueJobId = stage.uniqueJobId;
      const job = this.jobs[uniqueJobId];
      if (job) {
        job.cell?.taskChartStore.onSparkTaskStart(data);
      }
    }
  }

  onSparkTaskEnd(data: any) {
    const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
    const stage = this.stages[uniqueStageId];
    if (stage) {
      const uniqueJobId = stage.uniqueJobId;
      const job = this.jobs[uniqueJobId];
      if (job) {
        job.cell?.taskChartStore.onSparkTaskEnd(data);
      }
    }
  }

  // Periodic stage updates
  onSparkStageActive(data: any) {
    const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
    const stage = this.stages[uniqueStageId];
    if (stage && stage.status === 'RUNNING') {
      stage.numActiveTasks = data.numActiveTasks;
      stage.numCompletedTasks = data.numCompletedTasks;
      stage.numFailedTasks = data.numFailedTasks;

      const job = this.jobs[stage.uniqueJobId];
      if (job) {
        job.numActiveTasks = 0;
        job.numCompletedTasks = 0;
        job.numFailedTasks = 0;
        job.numTasks = 0;

        // Update active/completed/failed tasks number (scan all job stages tasks stats)
        job.uniqueStageIds.forEach(uniqueStageId => {
          job.numActiveTasks += this.stages[uniqueStageId]?.numActiveTasks || 0;
          job.numCompletedTasks +=
            this.stages[uniqueStageId]?.numCompletedTasks || 0;
          job.numFailedTasks += this.stages[uniqueStageId]?.numFailedTasks || 0;
          job.numTasks += this.stages[uniqueStageId]?.numTasks || 0;
        });
      }
    }
  }
}
