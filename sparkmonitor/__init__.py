# -*- coding: utf-8 -*-
"""Package sparkmonitor
    kernelextension.py is the Jupyter ipython kernel extension.
"""
from __future__ import absolute_import
from __future__ import unicode_literals

from ._version import __version__ 

def _jupyter_nbextension_paths():
    """Used by 'jupyter nbextension' command to install frontend extension"""
    return [dict(
        section='notebook',
        # the path is relative to the `my_fancy_module` directory
        src='nbextension',
        # directory in the `nbextension/` namespace
        dest='sparkmonitor',
        # _also_ in the `nbextension/` namespace
        require='sparkmonitor/extension')]