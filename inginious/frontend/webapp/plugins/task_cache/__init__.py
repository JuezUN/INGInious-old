import logging
import json
import os.path
from inginious.frontend.webapp.plugins.utils import create_static_resource_page
_PLUGIN_PATH = os.path.dirname(__file__)
_BASE_RENDERER_PATH = _PLUGIN_PATH
_BASE_STATIC_FOLDER = os.path.join(_PLUGIN_PATH, 'static')
_logger = logging.getLogger("inginious.frontend.webapp.plugins.task_cache")


def tag_selection_tab(course, taskid, task_data, template_helper):
    tab_id = 'tab_task_tags'
    link = '<i class="fa fa-tags fa-fw"></i>&nbsp; Tags'
    template_helper.add_css("/static/task_cache/css/bootstrap-tagsinput.css")
    template_helper.add_javascript("/static/task_cache/js/bootstrap-tagsinput.js")
    tags = task_data.get('tags', "")
    content = template_helper.get_custom_renderer(_BASE_RENDERER_PATH,
                                                  layout=False).tags(course, taskid, task_data, tags)
    return tab_id, link, content


def init(plugin_manager, course_factory, client, config):

    def on_task_updated(courseid, taskid, new_content):
        task_name = new_content["name"]
        descriptor = course_factory.get_course(courseid)._task_factory.get_task_descriptor_content(courseid, taskid)
        task_author = descriptor["author"]
        task_context = descriptor["context"]
        tags = new_content.get("tags", "").split(',')
        task_data = {
            "task_name": task_name,
            "task_id": taskid,
            "task_author": task_author,
            "task_context": task_context,
            "course_id": courseid,
            "tags": tags
        }

        data_filter = {
            "task_id": taskid,
            "course_id": courseid
        }

        plugin_manager.get_database().tasks_cache.update_one(filter=data_filter,
                                                             update={"$set": task_data}, upsert=True)

    def on_task_deleted(courseid, taskid):
        data_filter = {
            "task_id": taskid,
            "course_id": courseid
        }
        plugin_manager.get_database().tasks_cache.delete_many(data_filter)

    def on_course_deleted(courseid):
        data_filter = {
            "course_id": courseid
        }
        plugin_manager.get_database().tasks_cache.delete_many(data_filter)

    def on_course_updated(courseid, new_content):
        course_data = {
            "course_id": new_content["name"]
        }
        data_filter = {
            "course_id": courseid
        }
        plugin_manager.get_database().tasks_cache.update_many(filter=data_filter,
                                                              update={"$set": course_data})

    if "tasks_cache" not in plugin_manager.get_database().collection_names():
        plugin_manager.get_database().create_collection("tasks_cache")

    plugin_manager.get_database().tasks_cache.create_index([("course_id", 1), ("task_id", 1)], unique=True)

    plugin_manager.add_page(r'/static/task_cache/(.*)', create_static_resource_page(_BASE_STATIC_FOLDER))
    plugin_manager.add_hook('task_editor_tab', tag_selection_tab)
    plugin_manager.add_hook('task_updated', on_task_updated)
    plugin_manager.add_hook('task_deleted', on_task_deleted)
    plugin_manager.add_hook('course_updated', on_course_updated)
    plugin_manager.add_hook('course_deleted', on_course_deleted)

