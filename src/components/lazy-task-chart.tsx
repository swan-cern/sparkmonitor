import React, { Suspense } from 'react';

const TaskChart = React.lazy(
  () => import(/* webpackChunkName: "sparkmonitortaskchart" */ './task-chart')
);

export const LazyTaskChart = () => {
  return (
    <Suspense fallback={<div>loading</div>}>
      <TaskChart />
    </Suspense>
  );
};
