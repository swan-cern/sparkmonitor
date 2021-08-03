import React from 'react';
import { CellMonitor } from '../components/cell-monitor';
import { ReactWidget } from '@jupyterlab/apputils';
import '../../style/lab.css';
import { CellStoreContext, NotebookStoreContext, store } from '../store';

export const createCellWidget = (cellId: string, notebookId: string) => {
    const widget = ReactWidget.create(
        <NotebookStoreContext.Provider value={store.notebooks[notebookId]}>
            <CellStoreContext.Provider value={store.notebooks[notebookId].cells[cellId]}>
                <CellMonitor />
            </CellStoreContext.Provider>
        </NotebookStoreContext.Provider>,
    );
    widget.addClass('SparkMonitorCellWidget');
    return widget;
};
