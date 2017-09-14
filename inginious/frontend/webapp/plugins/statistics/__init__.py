from . import pages

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page("/statistics", pages.StatisticsPage)
    plugin_manager.add_page("/my_statistics", pages.UserStatisticsPage)
    plugin_manager.add_page(r'/static/statistics/(.*)', pages.StaticResourcePage)
    plugin_manager.add_hook('course_menu', pages.statistics_course_menu_hook)
