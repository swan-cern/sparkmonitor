# SparkMonitor

SparkMonitor is a Jupyter extension for monitoring Apache Spark jobs
launched from notebooks. It displays live Spark metrics directly in the
notebook interface, making it easier to understand, debug, and profile
Spark workloads as they run.

It supports **JupyterLab** and **classic Jupyter Notebook** with
**PySpark 3.x** and **4.x**.

## About

<table>
  <tr>
    <td>
      <a href="http://jupyter.org/">
        <img
          src="https://user-images.githubusercontent.com/6822941/29750386-872556fe-8b5c-11e7-95e1-42b12d709017.png"
          height="50"
          alt="Jupyter"
        />
      </a>
    </td>
    <td><b>+</b></td>
    <td>
      <a href="https://spark.apache.org/">
        <img
          src="https://user-images.githubusercontent.com/6822941/29750352-e9807b36-8b5b-11e7-929a-249f56c7cf79.png"
          height="80"
          alt="Apache Spark"
        />
      </a>
    </td>
    <td><b>=</b></td>
    <td>
      <a
        href="https://user-images.githubusercontent.com/6822941/29601568-d5e42934-87f9-11e7-9780-3cd3a0d8d86b.png"
        title="SparkMonitor Extension"
      >
        <img
          src="https://user-images.githubusercontent.com/6822941/29601568-d5e42934-87f9-11e7-9780-3cd3a0d8d86b.png"
          height="80"
          alt="SparkMonitor"
        />
      </a>
    </td>
  </tr>
</table>

SparkMonitor adds an interactive monitoring panel below notebook cells
that trigger Spark jobs, so you can inspect execution progress without
leaving the notebook.

---

![SparkMonitor job display](https://user-images.githubusercontent.com/6822941/29753710-ff8849b6-8b94-11e7-8f9c-bdc59bf72143.gif)

## Requirements

- **Python 3**
- **PySpark 3.x** or **4.x**
- **JupyterLab 4** or **Jupyter Notebook 4.4.0** or later
- **Spark Classic API mode**
  - SparkMonitor works with the traditional Spark driver model used by
    PySpark.
  - It is **not compatible** with
    [Spark Connect](https://spark.apache.org/docs/latest/spark-connect-overview.html).

## Features

- **Live monitoring** of Spark jobs launched from a notebook cell
- **Job and stage table** with progress bars and execution details
- **Timeline view** showing jobs, stages, and tasks over time
- **Resource graphs** for active tasks and executor core usage

<table>
  <tr>
    <td>
      <a
        href="https://user-images.githubusercontent.com/6822941/29601990-d6256a1e-87fb-11e7-94cb-b4418c61d221.png"
        title="Jobs and stages started from a cell"
      >
        <img
          src="https://user-images.githubusercontent.com/6822941/29601990-d6256a1e-87fb-11e7-94cb-b4418c61d221.png"
          alt="Jobs and stages view"
        />
      </a>
    </td>
    <td>
      <a
        href="https://user-images.githubusercontent.com/6822941/29601769-d8e82a26-87fa-11e7-9b0e-91b1414e7821.png"
        title="Graph of active tasks and available executor cores"
      >
        <img
          src="https://user-images.githubusercontent.com/6822941/29601769-d8e82a26-87fa-11e7-9b0e-91b1414e7821.png"
          alt="Resource graphs"
        />
      </a>
    </td>
    <td>
      <a
        href="https://user-images.githubusercontent.com/6822941/29601776-d919dae4-87fa-11e7-8939-a6c0d0072d90.png"
        title="Timeline of jobs, stages and tasks"
      >
        <img
          src="https://user-images.githubusercontent.com/6822941/29601776-d919dae4-87fa-11e7-8939-a6c0d0072d90.png"
          alt="Timeline view"
        />
      </a>
    </td>
  </tr>
</table>

## Quick Start

### Installation

Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

Install SparkMonitor together with PySpark and a notebook frontend.

#### For JupyterLab

```bash
pip install sparkmonitor pyspark jupyterlab
```

Enable the SparkMonitor IPython kernel extension:

```bash
ipython profile create
echo "c.InteractiveShellApp.extensions.append('sparkmonitor.kernelextension')" >> "$(ipython profile locate default)/ipython_kernel_config.py"
```

This only needs to be done once per IPython profile.

### Using SparkMonitor in a Notebook

To use SparkMonitor, create your Spark session with the SparkMonitor
listener enabled.

This requires two Spark configurations:

| Configuration                 | Purpose                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `spark.extraListeners`        | Registers the SparkMonitor listener that collects Spark job metrics             |
| `spark.driver.extraClassPath` | Points to the SparkMonitor listener JAR bundled with the `sparkmonitor` package |

### Example with a fixed environment path

If you already know the exact path in your environment, you can also
configure it directly:

```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder.config(
        "spark.extraListeners",
        "sparkmonitor.listener.JupyterSparkMonitorListener",
    )
    .config(
        "spark.driver.extraClassPath",
        "venv/lib/python3.13/site-packages/sparkmonitor/listener_2.13.jar",
    )
    .getOrCreate()
)
```

### Recommended example

The most robust approach is to resolve the listener JAR path
dynamically from the installed Python package instead of hardcoding the
full environment path:

```python
import os
from pathlib import Path

import sparkmonitor
from pyspark.sql import SparkSession


def resolve_listener_jar(sparkmonitor_dir: Path) -> Path:
  spark_home = Path(os.environ.get("SPARK_HOME", ""))
  for jar in (spark_home / "jars").glob("spark-core_*.jar"):
    # spark-core_2.13-3.5.8.jar => scala=2.13, spark_major=3
    scala_ver, spark_ver = jar.name.split("_")[1].split("-")[:2]
    spark_major = spark_ver.split(".")[0]
    if spark_major == "3" and scala_ver == "2.12":
      return sparkmonitor_dir / "listener_2.12.jar"
    if spark_major == "3" and scala_ver == "2.13":
      return sparkmonitor_dir / "listener_spark3_2.13.jar"
    if spark_major == "4" and scala_ver == "2.13":
      return sparkmonitor_dir / "listener_2.13.jar"

  raise RuntimeError("Could not detect Spark/Scala version from SPARK_HOME")


sparkmonitor_dir = Path(sparkmonitor.__file__).resolve().parent
listener_jar = resolve_listener_jar(sparkmonitor_dir)

spark = (
  SparkSession.builder.config(
    "spark.extraListeners",
    "sparkmonitor.listener.JupyterSparkMonitorListener",
  )
  .config("spark.driver.extraClassPath", str(listener_jar))
  .getOrCreate()
)
```

> **Important**
>
> The correct listener JAR depends on:
>
> - the location of your Python environment
> - your Spark major version and Scala version

You can inspect the installed package location with:

```python
import sparkmonitor

print(sparkmonitor.__path__)
```

Then locate the corresponding listener JAR in that package directory:

- `listener_2.12.jar` for Spark 3 + Scala 2.12
- `listener_spark3_2.13.jar` for Spark 3 + Scala 2.13
- `listener_2.13.jar` for Spark 4 + Scala 2.13

If needed, you can also build the listener JAR yourself with `sbt`, as
described in the development section below.

## Development

To work on SparkMonitor locally:

```bash
# Install the package in editable mode
pip install -e .

# Build the frontend (see package.json for available scripts)
yarn run build:<action>

# Link the JupyterLab extension into your local Jupyter environment
jupyter labextension develop --overwrite .

# Watch frontend files for changes
yarn run watch

# Build the Spark listener JARs
cd scalalistener_spark3 # Spark 3 / Scala 2.12 and 2.13
sbt +package

cd ../scalalistener_spark4 # Spark 4 / Scala 2.13
sbt package
```

## Troubleshooting

### SparkMonitor panel does not appear

Check the following:

- `sparkmonitor` is installed in the same Python environment as your
  notebook kernel
- `pyspark` is installed
- `jupyterlab` or `notebook` is installed
- the IPython kernel extension is enabled
- your Spark session includes `spark.extraListeners`
- `spark.driver.extraClassPath` points to a valid listener JAR
- you are using Spark Classic, not Spark Connect

### Wrong listener JAR selected

The listener JAR must match both your Spark major version and Scala
version:

```text
Spark 3 + Scala 2.12 -> listener_2.12.jar
Spark 3 + Scala 2.13 -> listener_spark3_2.13.jar
Spark 4 + Scala 2.13 -> listener_2.13.jar
```

Using the wrong listener JAR may prevent the listener from loading correctly.

### Hardcoded virtual environment path does not work

Avoid hardcoding paths when possible. Environment-specific paths vary
across systems, Python versions, and virtual environments. The dynamic
path resolution example above is usually more portable.

## Project History

- The first version of SparkMonitor was written by krishnan-r as a
  [Google Summer of Code project](https://github.com/krishnan-r/sparkmonitor)
  with the [SWAN](https://swan.web.cern.ch/swan/) Notebook Service team
  at [CERN](http://home.cern/).
- Further fixes and improvements were made by the CERN team and
  community contributors in
  [swan-cern/jupyter-extensions/tree/master/SparkMonitor](https://github.com/swan-cern/jupyter-extensions/tree/master/SparkMonitor).
- [Jafer Haider](https://github.com/itsjafer) updated the extension for
  JupyterLab during an internship at Yelp.
- Work from the
  [jupyterlab-sparkmonitor](https://github.com/itsjafer/jupyterlab-sparkmonitor)
  fork was later merged into this repository so that both JupyterLab and
  Jupyter Notebook are supported from a single package.
- Ongoing maintenance and development continue through the SWAN team at
  CERN and the community.

## References

- PyPI package: [sparkmonitor](https://pypi.org/project/sparkmonitor/)
- Releases:
  [swan-cern/sparkmonitor releases](https://github.com/swan-cern/sparkmonitor/releases)
