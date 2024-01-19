import { PromiseDelegate } from '@lumino/coreutils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';

// Logic adapted from https://github.com/deshaw/jupyterlab-execute-time/blob/master/src/ExecuteTimeWidget.ts

export default class CurrentCellTracker {
  isReady = new PromiseDelegate();
  cellSlotMap: { [cellId: string]: () => void } = {};
  activeCell?: Cell;
  lastExecutedCell?: Cell;
  cellReexecuted = false;
  numCellsExecuted = 0;
  notebook?: Notebook;

  // because the signal is emitted 3 times for every execution. Only want to increment by 1
  lastBusySignal = '';

  constructor(private notebookPanel: NotebookPanel) {
    this.init();
  }

  private async init() {
    await this.notebookPanel.revealed;
    this.notebook = this.notebookPanel.content;

    // Set the recordTiming setting to true
    this.notebook.notebookConfig.recordTiming = true;
    this.registerCells();
    this.isReady.resolve(undefined);
  }

  private registerMetadataChanges(cellModel: ICellModel) {
    if (!(cellModel.id in this.cellSlotMap)) {
      const fn = () => this.cellMetadataChanged(cellModel);
      this.cellSlotMap[cellModel.id] = fn;
      cellModel.metadataChanged.connect(fn);
      // In case there was already metadata (do not highlight on first load)
      this.cellMetadataChanged(cellModel);
    }
  }

  private deregisterMetadataChanges(cellModel: ICellModel) {
    const fn = this.cellSlotMap[cellModel.id];
    if (fn) {
      cellModel.metadataChanged.disconnect(fn);
    }
    delete this.cellSlotMap[cellModel.id];
  }

  private getCodeCellFromModel(cellModel: ICellModel) {
    if (cellModel.type === 'code') {
      const cell = this.notebookPanel.content.widgets.find(
        widget => widget.model === cellModel
      );
      return cell;
    }
    return null;
  }

  private cellMetadataChanged(cellModel: ICellModel) {
    const codeCell = this.getCodeCellFromModel(cellModel);

    if (codeCell) {
      const executionMetadata: any = codeCell.model.metadata['execution'];
      if (executionMetadata) {
        if (
          executionMetadata['iopub.status.busy'] &&
          this.lastBusySignal !== executionMetadata['iopub.status.busy']
        ) {
          this.activeCell = codeCell;
          this.cellReexecuted = this.lastExecutedCell === codeCell;
          this.lastExecutedCell = codeCell;
          this.numCellsExecuted += 1;
          this.lastBusySignal = executionMetadata['iopub.status.busy'];
        }
      }
    }
  }

  registerCells() {
    const cells = this.notebookPanel.context.model.cells;
    cells.changed.connect((_cells, changed) => {
      // While we could look at changed.type, it's easier to just remove all
      // oldValues and add back all new values
      changed.oldValues.forEach(this.deregisterMetadataChanges.bind(this));
      changed.newValues.forEach(this.registerMetadataChanges.bind(this));
    });
    for (let i = 0; i < cells.length; i += 1) {
      this.registerMetadataChanges(cells.get(i));
    }
  }

  getActiveCell() {
    return this.activeCell;
  }

  getCellReexecuted() {
    return this.cellReexecuted;
  }

  getNumCellsExecuted() {
    return this.numCellsExecuted;
  }

  ready() {
    return this.isReady.promise;
  }
}
