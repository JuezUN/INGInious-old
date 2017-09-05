from . import pages

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page("/statistics", pages.StatisticsPage)
    plugin_manager.add_page(r'/admin/([a-z0-9A-Z\-_]+)/statistics', pages.CourseStatisticsPage)
    plugin_manager.add_page(r'/static/statistics/(.*)', pages.StaticResourcePage)
    plugin_manager.add_hook('course_admin_menu', pages.statistics_course_admin_menu_hook)
