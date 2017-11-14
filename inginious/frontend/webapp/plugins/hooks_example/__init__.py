import logging
import json

_BASE_RENDERER_PATH = 'frontend/webapp/plugins/hooks_example'
_logger = logging.getLogger("inginious.frontend.webapp.plugins.hooks_example")


def on_task_updated(courseid, taskid, new_content):
    _logger.info("Task updated: %s (from course %s). New content:\n%s", taskid, courseid, str(new_content))


def on_task_deleted(courseid, taskid):
    _logger.info("Task deleted: %s (from course %s)", taskid, courseid)


def on_course_updated(courseid, new_content):
    _logger.info("Course updated: %s. New content:\n%s", courseid, str(new_content))


def on_course_created(courseid, new_content):
    _logger.info("Course created: %s. New content:\n%s", courseid, str(new_content))


def on_course_deleted(courseid):
    _logger.info("Course deleted: %s.", courseid)


def example_task_editor_tab(course, taskid, task_data, template_helper):
    tab_id = 'tab_example'
    link = '<i class="fa fa-edit fa-fw"></i>&nbsp; Example tab'
    content = 'This is a test'

    return tab_id, link, content


def example_task_editor_tab_2(course, taskid, task_data, template_helper):
    tab_id = 'tab_example_2'
    link = '<i class="fa fa-edit fa-fw"></i>&nbsp; Example tab 2'
    content = template_helper.get_custom_renderer(_BASE_RENDERER_PATH, layout=False).example_tab_2(course, taskid,
                                                                                                   task_data)

    return tab_id, link, content


def on_task_editor_submit(course, taskid, task_data, task_fs):
    # We can modify task data here
    task_data['example_field'] = 'test'

    # We can also check for correctness and raise an error if something is wrong
    if not task_data.get('example_task_hint', None):
        return json.dumps({"status": "error", "message": "You must provide a task hint"})


def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_hook('task_updated', on_task_updated)
    plugin_manager.add_hook('task_deleted', on_task_deleted)
    plugin_manager.add_hook('course_created', on_course_created)
    plugin_manager.add_hook('course_updated', on_course_updated)
    plugin_manager.add_hook('course_deleted', on_course_deleted)
    plugin_manager.add_hook('task_editor_tab', example_task_editor_tab)
    plugin_manager.add_hook('task_editor_tab', example_task_editor_tab_2)
    plugin_manager.add_hook('task_editor_submit', on_task_editor_submit)
