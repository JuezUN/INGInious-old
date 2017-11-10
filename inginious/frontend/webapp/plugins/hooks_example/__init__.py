import logging

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


def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_hook('task_updated', on_task_updated)
    plugin_manager.add_hook('task_deleted', on_task_deleted)
    plugin_manager.add_hook('course_created', on_course_created)
    plugin_manager.add_hook('course_updated', on_course_updated)
    plugin_manager.add_hook('course_deleted', on_course_deleted)
