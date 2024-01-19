import { observer } from 'mobx-react-lite';
import React from 'react';

import { useCellStore, useNotebookStore } from '../store';
import { CellMonitorHeader } from './header';
import { JobTable } from './job-table';
import { LazyTimeline } from './lazy-timeline';
import { LazyTaskChart } from './lazy-task-chart';

export const CellMonitor = observer(() => {
  const notebook = useNotebookStore();
  const cell = useCellStore();

  // If the cell has no spark job
  if (
    !cell ||
    cell?.uniqueJobIds?.length <= 0 ||
    cell.isRemoved ||
    notebook?.hideAllDisplays
  ) {
    return <div className="sparkMonitorCellRoot" />;
  }

  let tabContent = <></>;
  if (!cell.isCollapsed && cell?.view === 'jobs') {
    tabContent = <JobTable />;
  } else if (!cell.isCollapsed && cell?.view === 'taskchart') {
    tabContent = <LazyTaskChart />;
  } else if (!cell.isCollapsed && cell?.view === 'timeline') {
    tabContent = <LazyTimeline />;
  }

  return (
    <div className="sparkMonitorCellRoot CellMonitor pm">
      <CellMonitorHeader />
      <div className="content">{tabContent}</div>
    </div>
  );
});
