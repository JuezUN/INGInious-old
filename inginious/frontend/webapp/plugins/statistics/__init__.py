from . import pages

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page(r'/admin/([a-z0-9A-Z\-_]+)/statistics', pages.CourseStatisticsPage)
    plugin_manager.add_page(r'/static/statistics/(.*)', pages.StaticResourcePage)
    plugin_manager.add_page('/api/stats/admin/grade_count', pages.GradeCountStatisticsApi)
    plugin_manager.add_page('/api/stats/admin/grade_distribution', pages.GradeDistributionStatisticsApi)
    plugin_manager.add_page('/api/stats/admin/submissions_verdict', pages.SubmissionsByVerdictApi)
    plugin_manager.add_page('/api/stats/admin/best_submissions_verdict', pages.BestSubmissionsByVerdictApi)
    plugin_manager.add_hook('course_admin_menu', pages.statistics_course_admin_menu_hook)
