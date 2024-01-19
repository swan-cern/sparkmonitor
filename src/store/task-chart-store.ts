import { NotebookStore } from './notebook';

export class TaskChartStore {
  jobDataX: Array<number> = [];
  jobDataY: Array<number> = [];
  jobDataText: Array<string> = [];
  executorDataX: Array<number> = [];
  executorDataY: Array<number> = [];
  taskDataX: Array<number> = [];
  taskDataY: Array<number> = [];
  numActiveTasks = 0;

  constructor(private notebookStore: NotebookStore) {}

  addExecutorData(time: number, numCores: number) {
    this.executorDataX.push(time);
    this.executorDataY.push(numCores);
  }

  addTaskData(time: number, numTasks: number) {
    this.taskDataX.push(new Date(time).getTime());
    this.taskDataY.push(numTasks);
    this.addExecutorData(
      new Date(time).getTime(),
      this.notebookStore.numTotalCores || 0
    );
  }

  onSparkJobStart(data: any) {
    const submissionTimestamp = new Date(data.submissionTime).getTime();
    this.jobDataX.push(submissionTimestamp);
    this.jobDataY.push(0);
    this.jobDataText.push(`Job ${data.jobId} started`);

    this.addExecutorData(submissionTimestamp, data.totalCores);
  }

  onSparkJobEnd(data: any) {
    const completionTime = new Date(data.completionTime).getTime();
    this.jobDataX.push(completionTime);
    this.jobDataY.push(0);
    this.jobDataText.push(`Job ${data.jobId} ended`);
  }

  onSparkTaskStart(data: any) {
    this.addTaskData(data.launchTime, this.numActiveTasks);
    this.numActiveTasks += 1;
    this.addTaskData(data.launchTime, this.numActiveTasks);
  }

  onSparkTaskEnd(data: any) {
    this.addTaskData(data.finishTime, this.numActiveTasks);
    this.numActiveTasks -= 1;
    this.addTaskData(data.finishTime, this.numActiveTasks);
  }
}
