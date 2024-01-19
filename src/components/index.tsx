import React from 'react';
import { observer } from 'mobx-react-lite';

import { CellStoreContext, NotebookStoreContext, store } from '../store';
import { CellMonitor } from './cell-monitor';

export const CellWidget = observer(
  (props: { notebookId: string; cellId: string }) => {
    return (
      <NotebookStoreContext.Provider value={store.notebooks[props.notebookId]}>
        <CellStoreContext.Provider
          value={store.notebooks[props.notebookId].cells[props.cellId]}
        >
          <CellMonitor />
        </CellStoreContext.Provider>
      </NotebookStoreContext.Provider>
    );
  }
);
