import { observer } from 'mobx-react-lite';
import React from 'react';
import ReactTimeAgo from 'react-timeago';

import { useCellStore, useNotebookStore } from '../store';
import { ProgressBar } from './progress-bar';
import prettyMilliseconds from 'pretty-ms';
import { ErrorBoundary } from './error-boundary';

const StageItem = observer((props: { stageId: string }) => {
  const notebook = useNotebookStore();
  const stage = notebook.stages[props.stageId];
  return (
    <tr className="stagerow">
      <td className="tdstageid">{stage.stageId}</td>
      <td className="tdstagename">{stage.name}</td>
      <td className="tdstagestatus">
        <span className={stage.status}>{stage.status}</span>
      </td>
      <td className="tdtasks">
        <ProgressBar
          total={stage.numTasks}
          running={stage.numActiveTasks}
          completed={stage.numCompletedTasks}
        />
      </td>
      <td className="tdstagestarttime">
        <ReactTimeAgo date={stage.submissionTime} minPeriod={10} />
      </td>
      <td className="tdstageduration">
        {stage.completionTime
          ? prettyMilliseconds(
              stage.completionTime?.getTime() - stage.submissionTime.getTime()
            )
          : '-'}
      </td>
    </tr>
  );
});

const StageTable = observer((props: { jobId: string }) => {
  const notebook = useNotebookStore();
  const stageIds = notebook.jobs[props.jobId].uniqueStageIds;
  const rows = stageIds.map(stageId => {
    return <StageItem stageId={stageId} key={stageId} />;
  });
  return (
    <table className="stagetable">
      <thead>
        <tr>
          <th className="thstageid">ID</th>
          <th className="thstagename">Stage</th>
          <th className="thstagestatus">Status</th>
          <th className="thstagetasks">Tasks</th>
          <th className="thstagestart">Submission Time</th>
          <th className="thstageduration">Duration</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
});

const JobItem = observer((props: { jobId: string }) => {
  const notebook = useNotebookStore();
  const job = notebook?.jobs[props.jobId];
  const [stagesCollapsed, setStageTableCollapsed] = React.useState(true);
  const onClickCollapseStageTable = () => {
    setStageTableCollapsed(value => !value);
  };

  return (
    <>
      <tr className="jobrow">
        <td className="tdstagebutton" onClick={onClickCollapseStageTable}>
          <span
            className={
              'tdstageicon ' + (!stagesCollapsed ? 'tdstageiconcollapsed' : '')
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" viewBox="0 0 18 18">
              <g className="jp-icon0" fill="#616161" shapeRendering="geometricPrecision">
                <path d="M7.2,5.2L10.9,9l-3.8,3.8V5.2H7.2z"/>
              </g>
            </svg>
          </span>
        </td>
        <td className="tdjobid">{job.jobId}</td>
        <td className="tdjobname">{job.name}</td>
        <td className="tdjobstatus">
          <span className={'tditemjobstatus ' + job.status}>{job.status}</span>
        </td>
        <td className="tdjobstages">
          {job.numCompletedStages}/{job.numStages}
          {job.numSkippedStages > 0 ? `(${job.numSkippedStages} skipped)` : ''}
          {job.numActiveStages > 0 ? `(${job.numActiveStages} active)` : ''}
        </td>
        <td className="tdtasks">
          <ProgressBar
            total={job.numTasks}
            running={job.numActiveTasks}
            completed={job.numCompletedTasks}
          />
        </td>
        <td className="tdjobstarttime">
          <ReactTimeAgo date={job.startTime} minPeriod={10} />
        </td>
        <td className="tdjobduration">
          {job.endTime
            ? prettyMilliseconds(
                job.endTime?.getTime() - job.startTime.getTime()
              )
            : '-'}
        </td>
      </tr>
      {!stagesCollapsed && (
        <tr className="jobstagedatarow">
          <td className="stagetableoffset"></td>
          <td colSpan={7} className="stagedata">
            <StageTable jobId={props.jobId} />
          </td>
        </tr>
      )}
    </>
  );
});

export const JobTable = observer(() => {
  const cell = useCellStore();

  return (
    <ErrorBoundary>
      <div className="tabcontent">
        <table className="jobtable">
          <thead>
            <tr>
              <th className="thbutton"></th>
              <th className="thjobid">ID</th>
              <th className="thjobname">Job</th>
              <th className="thjobstatus">Status</th>
              <th className="thjobstages">Stages</th>
              <th className="thjobtasks">Tasks</th>
              <th className="thjobstart">Submission Time</th>
              <th className="thjobtime">Duration</th>
            </tr>
          </thead>
          <tbody className="jobtablebody">
            {cell.uniqueJobIds.map(jobId => (
              <JobItem jobId={jobId} key={jobId} />
            ))}
          </tbody>
        </table>
      </div>
    </ErrorBoundary>
  );
});
