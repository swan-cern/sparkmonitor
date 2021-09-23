import json
from pathlib import Path

from jupyter_packaging import wrap_installers, npm_builder, get_data_files
from setuptools import find_packages, setup


HERE = Path(__file__).parent.resolve()

lab_path = HERE / "sparkmonitor" / "labextension"

ensured_targets = [
    str(lab_path / "package.json"), 
    str(HERE / "sparkmonitor" / "static/extension.js"),
    str(HERE / "sparkmonitor" / "listener_2.11.jar"),
    str(HERE / "sparkmonitor" / "listener_2.12.jar")
    ]

data_file_spec = [
    (f"share/jupyter/labextensions/sparkmonitor", str(lab_path), "**"),
    (f"share/jupyter/labextensions/sparkmonitor", str(HERE), "install.json"),
]


builder = npm_builder(build_cmd="build:prod", build_dir=lab_path)

cmdclass = wrap_installers(post_develop=builder, pre_dist=builder, ensured_targets=ensured_targets)

long_description = (HERE / "README.md").read_text()

pkg_json = json.loads((HERE / "package.json").read_bytes())

setup(
    name=pkg_json["name"],
    version=pkg_json["version"],
    description=pkg_json["description"],
    long_description=long_description,
    long_description_content_type="text/markdown",
    author=pkg_json["author"]["name"],
    author_email=pkg_json["author"]["email"],
    maintainer=pkg_json["maintainers"][0]["name"],
    maintainer_email=pkg_json["maintainers"][0]["email"],
    url=pkg_json["homepage"],
    include_package_data=True,
    cmdclass=cmdclass,
    packages=find_packages(),
    license=pkg_json["license"],
    zip_safe=False,
    python_requires=">=3.6",
    data_files=get_data_files(data_file_spec),
    install_requires=[
        "jupyterlab~=3.0",
        "jupyter_packaging~=0.9,<2",
    ],
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab", "JupyterLab3"],
    classifiers=[
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Framework :: Jupyter",
    ],
)