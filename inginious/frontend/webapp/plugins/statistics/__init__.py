from . import pages


def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page(r'/static/statistics/(.*)', pages.StaticResourcePage)

    plugin_manager.add_page(r'/admin/([a-z0-9A-Z\-_]+)/statistics', pages.CourseAdminStatisticsPage)
    plugin_manager.add_page(r'/statistics/([a-z0-9A-Z\-_]+)', pages.UserStatisticsPage)

    plugin_manager.add_page("/api/stats/student/trials_and_best_grade", pages.TrialsAndBestGradeApi)
    plugin_manager.add_page("/api/stats/student/bar_submissions_per_tasks", pages.BarSubmissionsPerTasksApi)
    plugin_manager.add_hook('course_menu', pages.statistics_course_menu_hook)

    plugin_manager.add_page('/api/stats/admin/grade_count', pages.GradeCountStatisticsApi)
    plugin_manager.add_page('/api/stats/admin/grade_count_details', pages.GradeCountStatisticsDetailApi)
    plugin_manager.add_page('/api/stats/admin/grade_distribution', pages.GradeDistributionStatisticsApi)
    plugin_manager.add_page('/api/stats/admin/grade_distribution_details', pages.GradeDistributionStatisticsDetailApi)
    plugin_manager.add_page('/api/stats/admin/submissions_verdict', pages.SubmissionsByVerdictApi)
    plugin_manager.add_page('/api/stats/admin/submissions_verdict_details', pages.SubmissionsByVerdictStatisticsDetailApi)
    plugin_manager.add_page('/api/stats/admin/best_submissions_verdict', pages.BestSubmissionsByVerdictApi)
    plugin_manager.add_page('/api/stats/admin/best_submissions_verdict_details', pages.BestSubmissionsByVerdictStatisticsDetailApi)
    plugin_manager.add_hook('course_admin_menu', pages.statistics_course_admin_menu_hook)
