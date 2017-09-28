import web
import posixpath
import urllib
import os
from inginious.frontend.webapp.pages.utils import INGIniousAuthPage, INGIniousPage
from inginious.frontend.webapp.pages.course_admin.utils import INGIniousAdminPage
from inginious.common.filesystems.local import LocalFSProvider
import json

_BASE_RENDERER_PATH = 'frontend/webapp/plugins/statistics'
_BASE_STATIC_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')

class StaticResourcePage(INGIniousPage):
    def GET(self, path):
        path_norm = posixpath.normpath(urllib.parse.unquote(path))

        static_folder = LocalFSProvider(_BASE_STATIC_FOLDER)
        (method, mimetype_or_none, file_or_url) = static_folder.distribute(path_norm, False)

        if method == "local":
            web.header('Content-Type', mimetype_or_none)
            return file_or_url
        elif method == "url":
            raise web.redirect(file_or_url)

        raise web.notfound()

def statistics_course_admin_menu_hook(course):
    course_statistics_link = ""
    return ("statistics", '<i class="fa fa-bar-chart" aria-hidden="true"></i> Course statistics')

class CourseStatisticsPage(INGIniousAdminPage):

    def _compute_grade_count_statistics(self, course_id):
        statistics_by_grade = self.database.user_tasks.aggregate([
            {"$match": {"courseid": course_id}},
            {
                "$group": {
                    "_id": {"grade": {"$ceil": "$grade"}, "task": "$taskid"},
                    "count": {"$sum": 1}
                }
            }
        ])

        task_id_to_statistics = {}
        for element in statistics_by_grade:
            task_id = element["_id"]["task"]

            if task_id not in task_id_to_statistics:
                task_id_to_statistics[task_id] = []

            task_id_to_statistics[task_id].append({
                "grade": element["_id"]["grade"],
                "count": element["count"]
            })

        return task_id_to_statistics

    def _compute_grade_distribution_statistics(self, course_id):
        all_grades = self.database.user_tasks.find(
            {"courseid": course_id},
            {"taskid": 1, "grade": 1, "username": 1}
        )

        grouped_grades = {}
        for item in all_grades:
            task_id = item["taskid"]

            if task_id not in grouped_grades:
                grouped_grades[task_id] = []

            grouped_grades[task_id].append(item["grade"])

        return grouped_grades

    def GET_AUTH(self, course_id):
        course, _ = self.get_course_and_check_rights(course_id)

        course_tasks = course.get_tasks()
        sorted_tasks = sorted(course_tasks.values(), key=lambda task: task.get_order())

        grade_count_statistics = self._compute_grade_count_statistics(course_id)

        statistics_by_grade_count = [
            {
                "task_id": task.get_id(),
                "task_name": task.get_name(),
                "grades": grade_count_statistics.get(task.get_id(), [])
            } for task in sorted_tasks
        ]

        grade_distribution_statistics = self._compute_grade_distribution_statistics(course_id)

        statistics_by_grade_distribution = [
            {
                "task_id": task.get_id(),
                "task_name": task.get_name(),
                "grades": grade_distribution_statistics.get(task.get_id(), [])
            } for task in sorted_tasks
        ]

        statistics = {
            "by_grade_count": statistics_by_grade_count,
            "by_grade_distribution": statistics_by_grade_distribution,
        }

        statisticsJson = json.dumps(statistics)

        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js")
        self.template_helper.add_javascript("/static/statistics/js/statistics.js")
        self.template_helper.add_css("/static/statistics/css/statistics.css")

        return (
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).course_statistics(
                course, statisticsJson)
        )
