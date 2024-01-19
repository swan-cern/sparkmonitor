import React from 'react';
import { makeAutoObservable } from 'mobx';
import { NotebookStore } from './notebook';
import type { Cell } from './cell';

class SparkMonitorStore {
  notebooks: { [notebookId: string]: NotebookStore } = {};
  constructor() {
    makeAutoObservable(this);
  }
}

export const store = new SparkMonitorStore();

const StoreContext = React.createContext(store);
// Use a non-null assertion here so that we can avoid an unnecessary check for null down the component hierarchy.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const NotebookStoreContext = React.createContext<NotebookStore>(
  undefined!
);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
