# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.
import os
from inginious.frontend.webapp.plugins.utils import create_static_resource_page

_PLUGIN_PATH = os.path.dirname(__file__)
_BASE_RENDERER_PATH = _PLUGIN_PATH
_BASE_STATIC_FOLDER = os.path.join(_PLUGIN_PATH, 'static')


def additional_javascript():
    return os.path.join('/static', 'codemirror_linter', 'codemirror_linter.js')


def init(plugin_manager, _, _2, _3):
    plugin_manager.add_page(r'/static/codemirror_linter/(.*)', create_static_resource_page(_BASE_STATIC_FOLDER))
    plugin_manager.add_hook("javascript_footer", additional_javascript)
