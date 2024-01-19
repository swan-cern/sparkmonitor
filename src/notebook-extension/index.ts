import { JupyterNotebookSparkMonitor } from './jupyter-notebook-monitor';
import '../../style/notebook.css';

// Entrypoint module for the SparkMonitor Jupyter Notebook extension.
export function load_ipython_extension() {
  console.log('SparkMonitor: Loading SparkMonitor Front-End Extension');
  const monitor = new JupyterNotebookSparkMonitor();

  // For Debugging
  (window as any).sparkMonitor = monitor;
}
