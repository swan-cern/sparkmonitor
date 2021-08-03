import { observer } from 'mobx-react-lite';
import React from 'react';

import { DataSet, Timeline as VisTimeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

import { useCellStore, useNotebookStore } from '../store';
import { ErrorBoundary } from './error-boundary';
import '../../../style/timeline.css';

const timelineOptions: TimelineOptions = {
    // rollingMode: {
    //     follow: false,
    //     offset: 0.75,
    // },
    margin: {
        item: 2,
        axis: 2,
    },
    stack: true,
    showTooltips: true,
    minHeight: '100px',
    // zoomMax: 10800000,
    // zoomMin: 2000,
    editable: false,
    tooltip: {
        overflowMethod: 'cap',
    },
    align: 'center',
    orientation: 'top',
    verticalScroll: false,
};

export const Timeline = observer(() => {
    const notebook = useNotebookStore();
    const cell = useCellStore();

    const timelineDiv = React.useRef<HTMLDivElement>(null);

    const timelineData = [] as any[];
    cell.jobs.forEach((job) => {
        timelineData.push({
            id: job.uniqueId,
            start: job.startTime,
            content: `${job.jobId}:${job.name}`,
            group: 'jobs',
            className: 'job ' + job.status,
            mode: job.status === 'RUNNING' ? 'ongoing' : 'done',
            end: job.endTime ? job.endTime : new Date(),
        });
        job.uniqueStageIds.forEach((uniqueStageId) => {
            const stage = notebook.stages[uniqueStageId];
            if (stage.submissionTime) {
                timelineData.push({
                    id: stage.uniqueId,
                    start: stage.submissionTime,
                    content: `${stage.stageId}:${stage.name}`,
                    group: 'stages',
                    className: 'stage ' + stage.status,
                    mode: stage.status === 'RUNNING' ? 'ongoing' : 'done',
                    end: stage.completionTime ? stage.completionTime : new Date(),
                });
            }
        });
    });

    const timelineGroups = new DataSet([
        {
            id: 'jobs',
            content: 'Jobs',
            className: 'visjobgroup',
        },
        { id: 'stages', content: 'Stages' },
    ]);

    React.useEffect(() => {
        const timeline = new VisTimeline(timelineDiv.current!, timelineData, timelineGroups, timelineOptions);

        const refreshInterval = setInterval(() => {
            //
        });
        return () => {
            clearInterval(refreshInterval);
            timeline.destroy();
        };
    });
    return (
        <ErrorBoundary>
            <div className="timelinecontent tabcontent">
                <div className="timelinewrapper hidephases">
                    <div ref={timelineDiv} className="timelinecontainer1"></div>
                    {/* <div className="timelinecontainer2"></div> */}
                    {/* <div className="timelinecontainer3"></div> */}
                </div>
            </div>
        </ErrorBoundary>
    );
});