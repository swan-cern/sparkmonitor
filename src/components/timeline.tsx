import { observer } from 'mobx-react-lite';
import React from 'react';

import {
  DataSet,
  Timeline as VisTimeline,
  TimelineOptions
} from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

import { useCellStore, useNotebookStore } from '../store';
import { ErrorBoundary } from './error-boundary';

const timelineOptions: TimelineOptions = {
  margin: {
    item: 2,
    axis: 2
  },
  stack: true,
  showTooltips: true,
  minHeight: '100px',
  editable: false,
  tooltip: {
    overflowMethod: 'cap'
  },
  align: 'center',
  orientation: 'top',
  verticalScroll: false
};

const Timeline = observer(() => {
  const notebook = useNotebookStore();
  const cell = useCellStore();

  const timelineDiv = React.useRef<HTMLDivElement>(null);

  const timelineData = [] as any[];
  cell.jobs.forEach(job => {
    timelineData.push({
      id: job.uniqueId,
      start: job.startTime,
      content: `${job.jobId}:${job.name}`,
      group: 'jobs',
      className: 'job ' + job.status,
      mode: job.status === 'RUNNING' ? 'ongoing' : 'done',
      end: job.endTime ? job.endTime : new Date()
    });
    job.uniqueStageIds.forEach(uniqueStageId => {
      const stage = notebook.stages[uniqueStageId];
      if (stage.submissionTime) {
        timelineData.push({
          id: stage.uniqueId,
          start: stage.submissionTime,
          content: `${stage.stageId}:${stage.name}`,
          group: 'stages',
          className: 'stage ' + stage.status,
          mode: stage.status === 'RUNNING' ? 'ongoing' : 'done',
          end: stage.completionTime ? stage.completionTime : new Date()
        });
      }
    });
  });

  const timelineGroups = new DataSet([
    {
      id: 'jobs',
      content: 'Jobs',
      className: 'visjobgroup'
    },
    { id: 'stages', content: 'Stages' }
  ]);

  React.useEffect(() => {
    if (!timelineDiv.current) {
      return;
    }
    const timeline = new VisTimeline(
      timelineDiv.current,
      timelineData,
      timelineGroups,
      timelineOptions
    );
    return () => {
      timeline.destroy();
    };
  });
  return (
    <ErrorBoundary>
      <div className="tabcontent">
        <div className="timelinewrapper hidephases">
          <div ref={timelineDiv}></div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default Timeline;
