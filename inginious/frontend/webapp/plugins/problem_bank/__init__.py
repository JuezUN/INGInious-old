import os

from . import pages
from inginious.frontend.webapp.plugins.utils import create_static_resource_page

_BASE_STATIC_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page(r'/static/problem_bank/(.*)', create_static_resource_page(_BASE_STATIC_FOLDER))
    plugin_manager.add_page(r'/api/copy_task', pages.CopyTaskApi)
    plugin_manager.add_page(r'/api/manage_banks_courses', pages.ManageBanksCoursesApi)

