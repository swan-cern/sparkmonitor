# -*- coding: utf-8 -*-
"""Package sparkmonitor

This package contains two modules:
    kernelextension.py is the Jupyter kernel extension.
    serverextension.py is the Jupyter web server extension.
"""
from __future__ import absolute_import
from __future__ import unicode_literals

import json
from pathlib import Path

def _jupyter_nbextension_paths():
    """Used by 'jupyter nbextension' command to install frontend extension"""
    return [dict(
        section='notebook',
        # the path is relative to the `my_fancy_module` directory
        src='static',
        # directory in the `nbextension/` namespace
        dest='sparkmonitor',
        # _also_ in the `nbextension/` namespace
        require='sparkmonitor/module')]


def _jupyter_server_extension_paths():
    """Used by "jupyter serverextension" install web server extension'"""
    return [{
        'module': 'sparkmonitor.serverextension'
    }]

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]