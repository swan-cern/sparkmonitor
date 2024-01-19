/**
 * Module to detect the currently running cell.
 *
 * The notebook sends execution requests, and they queue up on the message channel.
 * There is no straight forward way to detect the currently running cell.
 * Here we use a queue to store execution requests and dequeue elements as the kernel becomes idle after the requests
 * @module currentcell
 */

import events from 'base/js/events';
import codecell from 'notebook/js/codecell';

let current_cell: any;
let last_cell: any;
/**The list of cells queued for execution. */
const cell_queue: any[] = [];

/** Called when an execute.CodeCell event occurs. This means an execute request was sent for the current cell. */
function cell_execute_called(event: any, data: any) {
  const cell = data.cell;
  if (cell instanceof codecell.CodeCell) {
    if (cell_queue.length <= 0) {
      events.trigger('started.currentcell', cell);
      events.trigger('started' + cell.cell_id + 'currentcell', cell);
    }
    cell_queue.push(cell);
    current_cell = cell_queue[0];
  }
}

/** Called when the kernel becomes idle. This means that a cell finished executing. */
function cell_execute_finished() {
  if (current_cell) {
    events.trigger('finished.currentcell', current_cell);
    events.trigger(
      'finished' + current_cell.cell_id + 'currentcell',
      current_cell
    );
  }
  cell_queue.shift();
  current_cell = cell_queue[0];
  if (current_cell) {
    events.trigger('started.currentcell', current_cell);
    events.trigger(
      'started' + current_cell.cell_id + 'currentcell',
      current_cell
    );
  }
}
/** @return {CodeCell} - The running cell, or null. */
export function getRunningCell() {
  return current_cell;
}

/** @return {CodeCell} - The last run cell, or null. */
export function getLastCell() {
  return last_cell;
}

/**
 * Called when a cell is deleted
 *
 * @param {event} event - The event object,
 * @param {data} data - data of the event, contains the cell
 */
function cell_deleted(event: any, data: any) {
  const cell = data.cell;
  const index = cell_queue.indexOf(cell);
  if (index >= -1) {
    cell_queue.splice(index, 1);
  }
}

/** Register event listeners for detecting running cells. */
export function register() {
  events.on('execute.CodeCell', cell_execute_called);
  events.on('kernel_idle.Kernel', cell_execute_finished);
  events.on('delete.Cell', cell_deleted);
  //TODO clear queue on execute error
  //For Debugging purposes. Highlights the currently running cell in grey colour.
  //events.on('started.currentcell', function (event, cell) { cell.element.css('background-color', '#EEEEEE') });
  //events.on('finished.currentcell', function (event, cell) { cell.element.css('background-color', 'white') });
}
