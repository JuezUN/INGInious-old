import os

from . import pages
from inginious.frontend.webapp.plugins.utils import create_static_resource_page

_BASE_STATIC_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')
_REACT_APP_BUILD_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'react_app', 'build', 'static')

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page(r'/static/problem_bank/react/(.*)', create_static_resource_page(_REACT_APP_BUILD_FOLDER))
    plugin_manager.add_page(r'/static/problem_bank/(.*)', create_static_resource_page(_BASE_STATIC_FOLDER))
    plugin_manager.add_page(r'/api/copy_task', pages.CopyTaskApi)
    plugin_manager.add_page(r'/api/bank_courses', pages.ManageBanksCoursesApi)
    plugin_manager.add_page('/plugins/problems_bank', pages.BankPage)

    if "problem_banks" not in plugin_manager.get_database().collection_names():
        plugin_manager.get_database().create_collection("problem_banks")
    plugin_manager.get_database().problem_banks.create_index([("courseid", 1)], unique=True)
