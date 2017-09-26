from . import pages


def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page("/statistics", pages.StatisticsPage)
    plugin_manager.add_page(r'/statistics/([a-z0-9A-Z\-_]+)', pages.UserStatisticsPage)
    plugin_manager.add_page("/api/stats/student/trials_and_best_grade", pages.TrialsAndBestGrade)
    plugin_manager.add_page(r'/static/statistics/(.*)', pages.StaticResourcePage)
    plugin_manager.add_hook('course_menu', pages.statistics_course_menu_hook)
