/**
 * Entrypoint module for the SparkMonitor frontend extension.
 *
 * @module module
 */

import { INotebookTracker, NotebookTracker } from '@jupyterlab/notebook';
import { IMainMenu, MainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import SparkMonitor from './jupyterlab-sparkmonitor';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { store } from '../store';
import { NotebookStore } from '../store/notebook';

/** Entrypoint: Called when the extension is loaded by jupyter. */
const extension = {
  id: 'jupyterlab_sparkmonitor',
  autoStart: true,
  requires: [INotebookTracker, IMainMenu],
  activate(
    app: JupyterFrontEnd,
    notebooks: NotebookTracker,
    mainMenu: MainMenu
  ) {
    let monitor: SparkMonitor;
    console.log('JupyterLab SparkMonitor is activated!');
    notebooks.widgetAdded.connect(async (sender, nbPanel) => {
      let notebookStore = store.notebooks[nbPanel.id];
      if (!notebookStore) {
        notebookStore = new NotebookStore(nbPanel.id);
        store.notebooks[nbPanel.id] = notebookStore;
      }

      // JupyterLab 1.0 backwards compatibility
      let kernel;
      let info;
      if ((nbPanel as any).session) {
        await (nbPanel as any).session.ready;
        kernel = (nbPanel as any).session.kernel;
        await kernel.ready;
        info = kernel.info;
      } else {
        // JupyterLab 2.0
        const { sessionContext } = nbPanel;
        await sessionContext.ready;
        kernel = sessionContext.session?.kernel;
        info = await kernel?.info;
      }

      if (info.language_info.name === 'python') {
        monitor = new SparkMonitor(nbPanel, notebookStore);
        console.log('Notebook kernel ready');
        monitor.startComm();
      }
    });

    const commandID = 'toggle-monitor';
    let toggled = false;

    app.commands.addCommand(commandID, {
      label: 'Hide Spark Monitoring',
      isEnabled: () => true,
      isVisible: () => true,
      isToggled: () => toggled,
      execute: () => {
        console.log(`Executed ${commandID}`);
        toggled = !toggled;
        monitor?.toggleAll();
      }
    });

    const menu = new Menu({ commands: app.commands });
    menu.title.label = 'Spark';
    menu.addItem({
      command: commandID,
      args: {}
    });

    mainMenu.addMenu(menu, false, { rank: 40 });
  }
};

export default extension;
