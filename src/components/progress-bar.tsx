import React from 'react';

export const ProgressBar = (props: {
  total: number;
  running: number;
  completed: number;
}) => {
  return (
    <div className="tdjobitemprogress cssprogress">
      <div className="data">
        {props.completed}/{props.total}
        {props.running > 0 ? ` (${props.running})` : ''}
      </div>
      <span
        className="val1"
        style={{
          width: ((1.0 * props.completed) / props.total) * 100 + '%'
        }}
      ></span>
      <span
        className="val2"
        style={{
          width: ((1.0 * props.running) / props.total) * 100 + '%'
        }}
      ></span>
    </div>
  );
};
