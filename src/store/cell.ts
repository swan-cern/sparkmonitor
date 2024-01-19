import { makeAutoObservable } from 'mobx';

import { TaskChartStore } from './task-chart-store';
import type { NotebookStore } from './notebook';

export class Cell {
  view: 'jobs' | 'taskchart' | 'timeline' = 'jobs';
  isCollapsed = false;
  isRemoved = false;
  uniqueJobIds: Array<string> = [];
  taskChartStore: TaskChartStore;
  constructor(
    public cellId: string,
    private notebookStore: NotebookStore
  ) {
    makeAutoObservable(this);
    this.taskChartStore = new TaskChartStore(this.notebookStore);
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
    return this.uniqueJobIds.map(id => this.notebookStore.jobs[id]);
  }

  get numActiveJobs() {
    return this.jobs.filter(job => job.status === 'RUNNING').length;
  }
  get numFailedJobs() {
    return this.jobs.filter(job => job.status === 'FAILED').length;
  }

  get numCompletedJobs() {
    return this.jobs.filter(job => job.status === 'COMPLETED').length;
  }

  get numTotalJobs() {
    return this.uniqueJobIds.length;
  }
}
