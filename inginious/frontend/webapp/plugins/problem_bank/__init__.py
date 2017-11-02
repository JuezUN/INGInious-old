from . import pages
from inginious.frontend.webapp.plugins.utils import create_static_resource_page
from .constants import _REACT_BASE_URL, _REACT_BUILD_FOLDER, _BASE_STATIC_FOLDER, _BASE_STATIC_URL


def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page(_REACT_BASE_URL + r'(.*)', create_static_resource_page(_REACT_BUILD_FOLDER))
    plugin_manager.add_page(_BASE_STATIC_URL + r'(.*)', create_static_resource_page(_BASE_STATIC_FOLDER))
    plugin_manager.add_page(r'/api/copy_task', pages.CopyTaskApi)
    plugin_manager.add_page(r'/api/bank_courses', pages.ManageBanksCoursesApi)
    plugin_manager.add_page('/plugins/problems_bank', pages.BankPage)

    if "problem_banks" not in plugin_manager.get_database().collection_names():
        plugin_manager.get_database().create_collection("problem_banks")
    plugin_manager.get_database().problem_banks.create_index([("courseid", 1)], unique=True)
