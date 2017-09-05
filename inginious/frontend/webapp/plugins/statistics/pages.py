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

class StatisticsPage(INGIniousAuthPage):
    def GET_AUTH(self):
        username = self.user_manager.session_username()

        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("static/statistics/js/statistics.js")

        total_users = self.database.users.count()
        total_submissions = self.database.submissions.count({"grade": { "$gte": 90}})

        return (
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).main(username, total_users,
                total_submissions)
        )

def statistics_course_admin_menu_hook(course):
    course_statistics_link = ""
    return ("statistics", '<i class="fa fa-bar-chart" aria-hidden="true"></i> Course statistics')

class CourseStatisticsPage(INGIniousAdminPage):
    def GET_AUTH(self, course_id):
        course, _ = self.get_course_and_check_rights(course_id)

        statistics_by_grade = self.database.submissions.aggregate([
            {"$match": {"courseid": course_id}},
            {
                "$group": {
                    "_id": {"grade": {"$ceil": "$grade"}},
                    "count": {"$sum": 1}
                }
            }
        ])

        statistics_by_result = self.database.submissions.aggregate([
            {"$match": {"courseid": course_id}},
            {
                "$group": {
                    "_id": {"result": "$result"},
                    "count": {"$sum": 1}
                }
            }
        ])

        statistics_by_grade = [
            {"grade": e["_id"]["grade"], "count": e["count"]} for e in statistics_by_grade
        ]
        statistics_by_result = [
            {"result": e["_id"]["result"], "count": e["count"]} for e in statistics_by_result
        ]

        statistics = {
            "by_grade": statistics_by_grade,
            "by_result": statistics_by_result
        }

        statisticsJson = json.dumps(statistics)

        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("/static/statistics/js/statistics.js")
        self.template_helper.add_css("/static/statistics/css/statistics.css")

        return (
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).course_statistics(
                course, statisticsJson)
        )
