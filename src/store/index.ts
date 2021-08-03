import { makeAutoObservable } from 'mobx';
import { TaskChartStore } from './task-chart-store';
import React from 'react';

class SparkJob {
    uniqueId!: string;
    cellId!: string;
    jobId!: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' = 'RUNNING';
    name = 'unnamed';
    startTime!: Date;
    endTime?: Date;
    stageIds: string[] = [];
    uniqueStageIds: string[] = [];

    numStages = 0;

    numTasks = 0;
    numActiveTasks = 0;
    numCompletedTasks = 0;
    numFailedTasks = 0;

    cell!: Cell;

    get numActiveStages() {
        return this.uniqueStageIds.filter((stageId) => {
            return this.notebookStore.stages[stageId].status === 'PENDING';
        }).length;
    }

    get numCompletedStages() {
        return this.uniqueStageIds.filter((stageId) => {
            return this.notebookStore.stages[stageId].status === 'COMPLETED';
        }).length;
    }

    get numFailedStages() {
        return this.uniqueStageIds.filter((stageId) => {
            return this.notebookStore.stages[stageId].status === 'FAILED';
        }).length;
    }

    get numSkippedStages() {
        return this.uniqueStageIds.filter((stageId) => {
            return this.notebookStore.stages[stageId].status === 'SKIPPED';
        }).length;
    }

    constructor(private notebookStore: NotebookStore) {
        makeAutoObservable(this);
    }
}

class SparkStage {
    uniqueId!: string;
    uniqueJobId!: string;
    cellId!: string;
    stageId!: string;
    // stageAttemptId: string;
    // stageAttemptId: string;
    status!: 'UNKNOWN' | 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PENDING' | 'SKIPPED';
    name!: string;

    numTasks!: number;
    numActiveTasks = 0;
    numCompletedTasks = 0;
    numFailedTasks = 0;
    // parentIds: string[];
    // parentIds: string[];
    submissionTime!: Date;
    completionTime?: Date;
    // jobIds: string[];

    constructor() {
        makeAutoObservable(this);
    }
}

class Cell {
    view: 'jobs' | 'taskchart' | 'timeline' = 'jobs';
    isCollapsed = false;
    isRemoved = false;
    // status: 'executing' | 'executed' | 'removed' | 're-executed';
    jobIds: Array<string> = [];
    taskChartStore = new TaskChartStore(this.notebookStore);

    constructor(public cellId: string, private notebookStore: NotebookStore) {
        makeAutoObservable(this);
    }

    toggleCollapseCellDisplay() {
        this.isCollapsed = !this.isCollapsed;
    }

    toggleHideCellDisplay() {
        this.isRemoved = !this.isRemoved;
    }

    setView(view: 'jobs' | 'taskchart' | 'timeline') {
        this.view = view;
        this.isCollapsed = false;
        this.isRemoved = false;
    }

    get jobs() {
        return this.jobIds.map((id) => this.notebookStore.jobs[id]);
    }

    get numActiveJobs() {
        return this.jobs.filter((job) => job.status === 'RUNNING').length;
    }
    get numFailedJobs() {
        return this.jobs.filter((job) => job.status === 'FAILED').length;
    }

    get numCompletedJobs() {
        return this.jobs.filter((job) => job.status === 'COMPLETED').length;
    }

    get numTotalJobs() {
        return this.jobIds.length;
    }
}

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

    onCellExecutedAgain(cellId: string) {
        delete this.cells[cellId];
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

        if (job.name === 'null') {
            const lastStageId = Math.max.apply(null, data.stageIds);
            job.name = this.stages[`${this.uniqueId}-stage-${lastStageId}`].name;
        }

        if (!this.cells[cellId]) {
            this.cells[cellId] = new Cell(cellId, this);
        }
        this.cells[cellId].jobIds.push(job.uniqueId);
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
            job.uniqueStageIds.forEach((uniqueStageId) => {
                if (this.stages[uniqueStageId]?.status === 'PENDING') {
                    this.stages[uniqueStageId].status = 'SKIPPED';
                    job.numTasks -= this.stages[uniqueStageId].numTasks;
                }
            });
            job.cell.taskChartStore.onSparkJobEnd(data);
        } else {
            console.warn('SparkMonitor: Could not identify job');
        }
    }

    onSparkStageSubmitted(cellId: string, data: any) {
        const submissionTime = data.submissionTime === -1 ? new Date() : new Date(data.submissionTime);
        const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
        if (!this.stages[uniqueStageId]) {
            this.stages[uniqueStageId] = new SparkStage();
            this.stages[uniqueStageId].uniqueId = uniqueStageId;
        }
        const stageData = this.stages[uniqueStageId];
        stageData.cellId = cellId;
        stageData.stageId = data.stageId;
        stageData.status = 'RUNNING';
        stageData.name = String(data.name).split(' ')[0];
        stageData.submissionTime = submissionTime;
        stageData.numTasks = data.numTasks;
    }

    onSparkStageCompleted(data: any) {
        const uniqueId = `${this.uniqueId}-stage-${data.stageId}`;
        const stageData = this.stages[uniqueId];
        if (stageData) {
            stageData.status = data.status;
            stageData.completionTime = new Date(data.completionTime);
            stageData.submissionTime = new Date(data.submissionTime);
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
        const stageData = this.stages[uniqueStageId];
        stageData.numActiveTasks += 1;

        const uniqueJobId = stageData.uniqueJobId;
        const jobData = this.jobs[uniqueJobId];
        jobData.numActiveTasks += 1;
        jobData.cell.taskChartStore.onSparkTaskStart(data);
    }

    onSparkTaskEnd(data: any) {
        const uniqueStageId = `${this.uniqueId}-stage-${data.stageId}`;
        const stageData = this.stages[uniqueStageId];
        const uniqueJobId = stageData.uniqueJobId;
        const jobData = this.jobs[uniqueJobId];

        stageData.numActiveTasks -= 1;
        jobData.numActiveTasks -= 1;
        if (data.status === 'SUCCESS') {
            stageData.numCompletedTasks += 1;
            jobData.numCompletedTasks += 1;
        } else {
            stageData.numFailedTasks += 1;
            jobData.numFailedTasks += 1;
        }
        jobData.cell.taskChartStore.onSparkTaskEnd(data);
    }
}

class SparkMonitorStore {
    notebooks: { [notebookId: string]: NotebookStore } = {};
    constructor() {
        makeAutoObservable(this);
    }
}

export const store = new SparkMonitorStore();

const StoreContext = React.createContext(store);
export const NotebookStoreContext = React.createContext<NotebookStore>(undefined!);
export const CellStoreContext = React.createContext<Cell>(undefined!);

export const useStore = () => {
    return React.useContext(StoreContext);
};

export const useNotebookStore = () => {
    return React.useContext(NotebookStoreContext);
};

export const useCellStore = () => {
    return React.useContext(CellStoreContext);
};

// For debugging
(window as any).sparkMonitorStore = store;
