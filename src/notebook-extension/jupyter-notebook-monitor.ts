import React from 'react';
import ReactDOM from 'react-dom';

import Jupyter from 'base/js/namespace';
import events from 'base/js/events';

import { CellWidget } from '../components';
import * as cellTracker from './currentcell';
import { NotebookStore } from '../store/notebook';
import { store } from '../store';

export class JupyterNotebookSparkMonitor {
  comm: any = null;
  notebookStore: NotebookStore;

  constructor() {
    cellTracker.register();

    // For jupyter notebook a single page has only one notebook.
    store.notebooks['default'] = new NotebookStore('default');
    this.notebookStore = store.notebooks['default'];

    // Initialize Cell React Widgets
    this.createCellReactElements();

    // Connect on page load
    this.startComm();

    // Reconnect on Kernel restarts
    events.on('kernel_connected.Kernel', () => {
      this.startComm();
    });

    events.on('clear_output.CodeCell', (event: any, data: any) => {
      //Removing display when output area is cleared
      const cellId = data.cell.cell_id;
      this.onClearCellOutput(cellId);
    });
    this.createButtons();
  }

  startComm() {
    console.log('SparkMonitor: Starting Comm with kernel.');
    if (Jupyter.notebook.kernel) {
      this.comm = Jupyter.notebook.kernel.comm_manager.new_comm(
        'SparkMonitor',
        { msgtype: 'openfromfrontend' }
      );
      // Register a message handler
      this.comm.on_msg((msg: any) => this.handleCommMessage(msg));
      // this.comm.on_close($.proxy(that.on_comm_close, that)); // noop
    } else {
      console.log('SparkMonitor: No communication established, kernel null');
    }
  }

  createCellReactElements() {
    events.on('execute.CodeCell', (event: any, data: any) => {
      const cell = data.cell;
      const cellDiv: HTMLDivElement = cell.element.get(0);
      if (!cellDiv.querySelector('.sparkMonitorCellRoot')) {
        const element = document.createElement('div');
        cellDiv
          .querySelector('.input')
          ?.insertAdjacentElement('afterend', element);
        this.notebookStore.onCellExecutedAgain(cell.cell_id);
        const cellWidget = React.createElement(CellWidget, {
          notebookId: 'default',
          cellId: cell.cell_id
        });
        ReactDOM.render(cellWidget, element);
      }
    });
  }

  createButtons() {
    let isVisible = true;

    const handler = () => {
      this.notebookStore.toggleHideAllDisplays();
      if ((isVisible = !isVisible)) {
        button.removeClass('disable');
      } else {
        button.addClass('disable');
      }
    };

    const action = {
      icon: 'fa-tasks', // a font-awesome class for icon
      help: 'Show/Hide Spark Monitoring',
      help_index: 'zz', // Sorting Order in keyboard shortcut dialog
      handler
    };
    const prefix = 'SparkMonitor';
    const action_name = 'toggle-spark-monitoring';

    const full_action_name = Jupyter.actions.register(
      action,
      action_name,
      prefix
    ); // returns 'my_extension:show-alert'
    const button = Jupyter.toolbar.add_buttons_group([full_action_name]);

    button.addClass('extension_button');
  }

  handleCommMessage(msg: any) {
    if (!msg.content.data.msgtype) {
      console.warn('SparkMonitor: Unknown message');
    }
    if (msg.content.data.msgtype === 'fromscala') {
      const data = JSON.parse(msg.content.data.msg);
      switch (data.msgtype) {
        case 'sparkJobStart':
          this.onSparkJobStart(data);
          break;
        case 'sparkJobEnd':
          this.notebookStore.onSparkJobEnd(data);
          break;
        case 'sparkStageSubmitted':
          this.onSparkStageSubmitted(data);
          break;
        case 'sparkStageCompleted':
          this.notebookStore.onSparkStageCompleted(data);
          break;
        case 'sparkStageActive':
          this.notebookStore.onSparkStageActive(data);
          break;
        case 'sparkTaskStart':
          this.notebookStore.onSparkTaskStart(data);
          break;
        case 'sparkTaskEnd':
          this.notebookStore.onSparkTaskEnd(data);
          break;
        case 'sparkApplicationStart':
          this.notebookStore.onSparkApplicationStart(data);
          break;
        case 'sparkApplicationEnd':
          // noop
          break;
        case 'sparkExecutorAdded':
          this.notebookStore.onSparkExecutorAdded(data);
          break;
        case 'sparkExecutorRemoved':
          this.notebookStore.onSparkExecutorRemoved(data);
          break;
      }
    }
  }

  onClearCellOutput(cellId: string) {
    this.notebookStore.onCellExecutedAgain(cellId);
  }

  onSparkJobStart(data: any) {
    const cell = cellTracker.getRunningCell();
    if (!cell) {
      console.error('SparkMonitor: Job start event with no running cell.');
      return;
    }
    this.notebookStore.onSparkJobStart(cell.cell_id, data);
  }

  onSparkStageSubmitted(data: any) {
    const cell = cellTracker.getRunningCell();
    if (!cell) {
      console.error('SparkMonitor: Stage submit event with no running cell.');
      return;
    }
    this.notebookStore.onSparkStageSubmitted(cell.cell_id, data);
  }
}
