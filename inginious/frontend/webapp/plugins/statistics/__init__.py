from . import pages


def init(plugin_manager, _course_factory, _client, _config):
    plugin_manager.add_page(r'/admin/([a-z0-9A-Z\-_]+)/statistics', pages.CourseAdminStatisticsPage)
    plugin_manager.add_page(r'/static/statistics/(.*)', pages.StaticResourcePage)
    plugin_manager.add_page('/api/stats/admin/grade_count', pages.GradeCountStatisticsApi)
    plugin_manager.add_page('/api/stats/admin/grade_distribution', pages.GradeDistributionStatisticsApi)
    plugin_manager.add_hook('course_admin_menu', pages.statistics_course_admin_menu_hook)
