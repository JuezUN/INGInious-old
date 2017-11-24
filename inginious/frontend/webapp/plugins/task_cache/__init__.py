import logging
import json

_BASE_RENDERER_PATH = 'frontend/webapp/plugins/hooks_example'
_logger = logging.getLogger("inginious.frontend.webapp.plugins.hooks_example")


def on_task_deleted(courseid, taskid):
    _logger.info("Task deleted: %s (from course %s)", taskid, courseid)


def on_course_updated(courseid, new_content):
    _logger.info("Course updated: %s. New content:\n%s", courseid, str(new_content))


def on_course_created(courseid, new_content):
    _logger.info("Course created: %s. New content:\n%s", courseid, str(new_content))


def on_course_deleted(courseid):
    _logger.info("Course deleted: %s.", courseid)

def on_task_editor_submit(course, taskid, task_data, task_fs):
    # We can modify task data here
    task_data['example_field'] = 'test'
    # We can also check for correctness and raise an error if something is wrong
    if not task_data.get('example_task_hint', None):
        return json.dumps({"status": "error", "message": "You must provide a task hint"})


def init(plugin_manager, course_factory, client, config):
    def on_task_updated(courseid, taskid, new_content):
        _logger.info("Task updated: %s (from course %s). New content:\n%s", taskid, courseid, str(new_content))

        task_name = new_content["name"]
        tags = new_content.get("tags", [])
        task_data = {
            "task_name" : task_name,
            "task_id" : taskid,
            "course_id" : courseid,
            "tags" : tags
        }

        filter_data = {
            "task_id" : taskid,
            "course_id" : courseid
        }

        plugin_manager.get_database().tasks_cache.update_one(filter=filter_data, update={"$set" : task_data}, upsert=True)

    if "tasks_cache" not in plugin_manager.get_database().collection_names() :
        plugin_manager.get_database().create_collection("tasks_cache")
    plugin_manager.get_database().tasks_cache.create_index([("course_id" , 1), ("task_id", 1)], unique=True )

    plugin_manager.add_hook('task_updated', on_task_updated)
    # plugin_manager.add_hook('task_deleted', on_task_deleted)
    # plugin_manager.add_hook('course_created', on_course_created)
    # plugin_manager.add_hook('course_updated', on_course_updated)
    # plugin_manager.add_hook('course_deleted', on_course_deleted)
    #plugin_manager.add_hook('task_editor_submit', on_task_editor_submit)
