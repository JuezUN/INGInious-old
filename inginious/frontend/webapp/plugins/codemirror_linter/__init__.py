# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.
import os
from inginious.frontend.webapp.plugins.utils import create_static_resource_page

_PLUGIN_PATH = os.path.dirname(__file__)
_BASE_RENDERER_PATH = _PLUGIN_PATH
_BASE_STATIC_FOLDER = os.path.join(_PLUGIN_PATH, 'static')


def linter_base_framework():
    return os.path.join('/static', 'codemirror_linter', 'lint.js')


def custom_linter():
    return os.path.join('/static', 'codemirror_linter', 'codemirror_linter.js')


def lint_style():
    return os.path.join('/static', 'codemirror_linter', 'lint.css')

def init(plugin_manager, _, _2, _3):
    plugin_manager.add_page(r'/static/codemirror_linter/(.*)', create_static_resource_page(_BASE_STATIC_FOLDER))
    plugin_manager.add_hook('css', lint_style)
    plugin_manager.add_hook('javascript_footer', linter_base_framework)
    plugin_manager.add_hook('javascript_footer', custom_linter)
