# SparkMonitor

An extension for [Jupyter Lab](https://jupyterlab.readthedocs.io/en/stable/) & [Jupyter Notebook](https://jupyter.org/) to monitor Apache Spark (pyspark) job execution from notebooks.

## About

<table>
<tr>
<td><a href="http://jupyter.org/"><img src="https://user-images.githubusercontent.com/6822941/29750386-872556fe-8b5c-11e7-95e1-42b12d709017.png" height="50"/></a></td>
<td><b>+</b></td>
<td><a href="https://spark.apache.org/"><img src="https://user-images.githubusercontent.com/6822941/29750352-e9807b36-8b5b-11e7-929a-249f56c7cf79.png" height="80"/></a></td>
<td><b>=</b></td>
<td><a href="https://user-images.githubusercontent.com/6822941/29601568-d5e42934-87f9-11e7-9780-3cd3a0d8d86b.png" title="The SparkMonitor Extension."><img src="https://user-images.githubusercontent.com/6822941/29601568-d5e42934-87f9-11e7-9780-3cd3a0d8d86b.png" height="80"/></a></td>
</tr>
</table>
SparkMonitor is an extension for Jupyter Notebook & Lab that enables the live monitoring of Apache Spark Jobs spawned from a notebook. The extension provides several features to monitor and debug a Spark job from within the notebook interface. <br>

---

![jobdisplay](https://user-images.githubusercontent.com/6822941/29753710-ff8849b6-8b94-11e7-8f9c-bdc59bf72143.gif)

## Requirements

- **JupyterLab 4** or **Jupyter Notebook 4.4.0** or later
- **PySpark 3.x** or **4.x**
  - SparkMonitor requires **Spark API mode "Spark Classic"** (default in Spark 3.x and 4.0).
  - **Not compatible** with [Spark Client (Spark Connect)](https://spark.apache.org/docs/latest/spark-connect-overview.html), which uses the new decoupled client-server architecture.

## Features

- **Live Monitoring:** Automatically displays an interactive monitoring panel below each cell that runs Spark jobs in your Jupyter notebook.
- **Job and Stage Table:** View a real-time table of Spark jobs and stages, each with progress bars for easy tracking.
- **Timeline Visualization:** Explore a dynamic timeline showing the execution flow of jobs, stages, and tasks.
- **Resource Graphs:** Monitor active tasks and executor core usage over time with intuitive graphs.

<table>
<tr>
<td><a href="https://user-images.githubusercontent.com/6822941/29601990-d6256a1e-87fb-11e7-94cb-b4418c61d221.png" title="Jobs and stages started from a cell."><img src="https://user-images.githubusercontent.com/6822941/29601990-d6256a1e-87fb-11e7-94cb-b4418c61d221.png"></a></td>
<td><a href="https://user-images.githubusercontent.com/6822941/29601769-d8e82a26-87fa-11e7-9b0e-91b1414e7821.png" title="A graph of the number of active tasks and available executor cores."><img src="https://user-images.githubusercontent.com/6822941/29601769-d8e82a26-87fa-11e7-9b0e-91b1414e7821.png" ></a></td>
<td><a href="https://user-images.githubusercontent.com/6822941/29601776-d919dae4-87fa-11e7-8939-a6c0d0072d90.png" title="An event timeline with jobs, stages and tasks across various executors. The tasks are split into various coloured phases, providing insight into the nature of computation."><img src="https://user-images.githubusercontent.com/6822941/29601776-d919dae4-87fa-11e7-8939-a6c0d0072d90.png"></a></td>
</tr>
</table>

## Quick Start

### Installation

```bash
pip install sparkmonitor # install the extension

# set up an ipython profile and add our kernel extension to it
ipython profile create # if it does not exist
echo "c.InteractiveShellApp.extensions.append('sparkmonitor.kernelextension')" >>  $(ipython profile locate default)/ipython_kernel_config.py

# When using jupyterlab extension is automatically enabled

# When using older versions of jupyter notebook install and enable the nbextension with:
jupyter nbextension install sparkmonitor --py
jupyter nbextension enable  sparkmonitor --py
```

### How to use SparkMonitor in your notebook

Create your Spark session with the extra configurations to activate the SparkMonitor listener.
You will need to set `spark.extraListeners` to `sparkmonitor.listener.JupyterSparkMonitorListener` and
`spark.driver.extraClassPath` to the path to the sparkmonitor python package: `path/to/package/sparkmonitor/listener_<scala_version>.jar`  
Example:

```python
from pyspark.sql import SparkSession
spark = SparkSession.builder\
        .config('spark.extraListeners', 'sparkmonitor.listener.JupyterSparkMonitorListener')\
        .config('spark.driver.extraClassPath', 'venv/lib/python3.12/site-packages/sparkmonitor/listener_2.13.jar')\
        .getOrCreate()
```

Legacy: with the extension installed, a `SparkConf` object called `conf` will be usable from your notebooks. You can use it as follows:

```python
from pyspark import SparkContext
# Start the spark context using the SparkConf object named `conf` the extension created in your kernel.
sc=SparkContext.getOrCreate(conf=conf)
```

## Development

If you'd like to develop the extension:

```bash

# See package.json scripts for building the frontend
yarn run build:<action>

# Install the package in editable mode
pip install -e .

# Symlink jupyterlab extension
jupyter labextension develop --overwrite .

# Watch for frontend changes
yarn run watch

# Build the spark JAR files
sbt +package

```

## History

- The first version of SparkMonitor was written by krishnan-r as a [Google Summer of Code project](https://github.com/krishnan-r/sparkmonitor) with the [SWAN](https://swan.web.cern.ch/swan/) Notebook Service team at [CERN](http://home.cern/).

- Further fixes and improvements were made by the team at CERN and members of the community maintained at [swan-cern/jupyter-extensions/tree/master/SparkMonitor](https://github.com/swan-cern/jupyter-extensions/tree/master/SparkMonitor)

- [Jafer Haider](https://github.com/itsjafer) worked on updating the extension to be compatible with JupyterLab as part of his internship at Yelp.

  - Jafer's work at the fork [jupyterlab-sparkmonitor](https://github.com/itsjafer/jupyterlab-sparkmonitor) has since been merged into this repository to provide a single package for both JupyterLab and Jupyter Notebook.

- Further development and maintenance is being done by the SWAN team at CERN and the community.

## Changelog

This repository is published to pypi as [sparkmonitor](https://pypi.org/project/sparkmonitor/)

- 2.x see the [github releases page](https://github.com/swan-cern/sparkmonitor/releases) of this repository

- 1.x and below were published from [swan-cern/jupyter-extensions](https://github.com/swan-cern/jupyter-extensions) and some initial versions from [krishnan-r/sparkmonitor](https://github.com/krishnan-r/sparkmonitor)
