import React from 'react';
import Plotly from 'plotly.js-basic-dist';
import { observer } from 'mobx-react-lite';
import { useCellStore } from '../store';

import createPlotlyComponent from 'react-plotly.js/factory';
import { ErrorBoundary } from './error-boundary';
const Plot = createPlotlyComponent(Plotly);

const plotDefaultLayout: Partial<Plotly.Layout> = {
  showlegend: true,
  margin: {
    t: 30, // top margin
    l: 30, // left margin
    r: 30, // right margin
    b: 60 // bottom margin
  },
  xaxis: {
    type: 'date'
    // title: 'Time',
  },
  yaxis: {
    fixedrange: true
  },
  dragmode: 'pan',
  shapes: [],
  legend: {
    orientation: 'h',
    x: 0,
    y: 5,
    // traceorder: 'normal',
    font: {
      family: 'sans-serif',
      size: 12,
      color: '#000'
    }
    // bgcolor: '#E2E2E2',
    // bordercolor: '#FFFFFF',
    // borderwidth: 2
  }
};

const plotOptions = { displaylogo: false, scrollZoom: true };

const TaskChart = observer(() => {
  const cell = useCellStore();
  const taskChartStore = cell.taskChartStore;

  const [chartRefreshRevision, setRevision] = React.useState(1);

  const data = React.useMemo(() => {
    const tasktrace: Plotly.Data = {
      x: taskChartStore.taskDataX,
      y: taskChartStore.taskDataY,
      fill: 'tozeroy',
      type: 'scatter',
      mode: 'none',
      fillcolor: '#00aedb',
      name: 'Active Tasks'
    };
    const executortrace: Plotly.Data = {
      x: taskChartStore.executorDataX,
      y: taskChartStore.executorDataY,
      fill: 'tozeroy',
      type: 'scatter',
      mode: 'none',
      fillcolor: '#F5C936',
      name: 'Executor Cores'
    };
    const jobtrace: Plotly.Data = {
      x: taskChartStore.jobDataX,
      y: taskChartStore.jobDataY,
      text: taskChartStore.jobDataText as any, //this.jobDataText,
      type: 'scatter',
      mode: 'markers',
      fillcolor: '#F5C936',
      // name: 'Jobs',
      showlegend: false,
      marker: {
        symbol: 23,
        color: '#4CB5AE',
        size: 1
      }
    };
    return [executortrace, tasktrace, jobtrace];
  }, [
    taskChartStore.taskDataX,
    taskChartStore.taskDataY,
    taskChartStore.executorDataX,
    taskChartStore.executorDataY,
    taskChartStore.jobDataX,
    taskChartStore.jobDataY,
    taskChartStore.jobDataText
  ]);

  const plotLayout: Partial<Plotly.Layout> = React.useMemo(() => {
    return {
      ...plotDefaultLayout,
      shapes: taskChartStore.jobDataX.map(job => {
        return {
          type: 'line',
          yref: 'paper',
          x0: job,
          y0: 0,
          x1: job,
          y1: 1,
          line: {
            color: '#4CB5AE',
            width: 1.5
          }
        };
      }),
      datarevision: chartRefreshRevision
    };
  }, [taskChartStore.jobDataX, chartRefreshRevision]);

  // Periodically refresh the chart by updating the revision
  React.useEffect(() => {
    const refreshInterval = setInterval(() => {
      setRevision(revision => revision + 1);
    }, 2000);
    return () => {
      // clean up when react component is unmounted.
      clearInterval(refreshInterval);
    };
  });

  return (
    <ErrorBoundary>
      <div className="tabcontent">
        <Plot
          layout={plotLayout}
          data={data}
          config={plotOptions}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          revision={chartRefreshRevision}
        />
      </div>
    </ErrorBoundary>
  );
});
export default TaskChart;
