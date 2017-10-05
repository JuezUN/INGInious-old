import web
import posixpath
import urllib
import os
import inginious.frontend.webapp.pages.api._api_page as api
from inginious.frontend.webapp.pages.api._api_page import APIAuthenticatedPage
from inginious.common.course_factory import CourseNotFoundException, CourseUnreadableException, InvalidNameException
from inginious.frontend.webapp.pages.utils import INGIniousAuthPage, INGIniousPage
from inginious.common.filesystems.local import LocalFSProvider

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


def statistics_course_menu_hook(course, template_helper):
    return """
            <h3>Statistics</h3>
            <a class="list-group-item list-group-item-info"
                href="/statistics/{course_id}">
                <i class="fa fa-group fa-fw"></i>
                My Statistics
            </a>""".format(course_id=course.get_id())


class UserStatisticsPage(INGIniousAuthPage):
    def GET_AUTH(self, course_id):
        self.template_helper.add_javascript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.3.6/papaparse.min.js")
        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("/static/statistics/js/statistics.js")
        self.template_helper.add_css("/static/statistics/css/statistics.css")

        return (
            self.template_helper
                .get_custom_renderer(_BASE_RENDERER_PATH)
                .user_statistics(course_id)
        )


class UserStatisticsApi(APIAuthenticatedPage):
    def API_GET(self):
        self.validate_parameters()
        return self.statistics()

    def validate_parameters(self):
        username = self.user_manager.session_username()
        course_id = web.input(course_id=None).course_id

        if course_id is None:
            raise api.APIError(400, {"error": "course_id is mandatory"})

        try:
            course = self.course_factory.get_course(course_id)
        except (CourseNotFoundException, InvalidNameException, CourseUnreadableException):
            raise api.APIError(400, {"error": "The course does not exist or the user does not have permissions"})

        if not self.user_manager.course_is_user_registered(course, username):
            raise api.APIError(400, {"error": "The course does not exist or the user does not have permissions"})

    def statistics(self):
        return "[]"


class TrialsAndBestGradeApi(UserStatisticsApi):
    def statistics(self):
        username = self.user_manager.session_username()
        course_id = web.input().course_id

        best_submissions = self.database.user_tasks.aggregate([
            {
                "$match":
                    {
                        "username": username,
                        "courseid": course_id
                    }
            },
            {
                "$lookup":
                    {
                        "from": "submissions",
                        "localField": "submissionid",
                        "foreignField": "_id",
                        "as": "submission"
                    }
            },
            {
                "$unwind":
                    {
                        "path": "$submission"
                    }
            },
            {
                "$sort":
                    {
                        "submission.submitted_on": 1
                    }

            },
            {
                "$project":
                    {
                        "_id": 0,
                        "result": "$submission.custom.summary_result",
                        "taskid": 1,
                        "tried": 1,
                        "grade": 1
                    }
            },
            {
                "$match":
                    {
                        "result": {"$ne": None}
                    }
            }
        ])

        return 200, list(best_submissions)


class BarSubmissionsPerTasksApi(UserStatisticsApi):
    def statistics(self):
        username = self.user_manager.session_username()
        course_id = web.input().course_id

        submissions_per_task = self.database.submissions.aggregate([
            {
                "$match":
                    {
                        "username": [username],
                        "courseid": course_id,
                        "custom.summary_result": {"$ne": None}
                    }
            },
            {
                "$group": {
                    "_id":
                        {
                            "summary_result": "$custom.summary_result",
                            "task_id": "$taskid"
                        },
                    "count": {"$sum": 1}
                }
            },
            {
                "$project":
                    {
                        "_id": 0,
                        "task_id": "$_id.task_id",
                        "summary_result": "$_id.summary_result",
                        "count": 1
                    }
            },
            {
                "$sort": {"task_id": -1}
            }
        ])

        course = self.course_factory.get_course(course_id)
        course_tasks = course.get_tasks()
        sorted_tasks = sorted(course_tasks.values(), key=lambda task: task.get_order())

        task_id_to_statistics = {}
        for element in submissions_per_task:
            task_id = element["task_id"]

            if task_id not in task_id_to_statistics:
                task_id_to_statistics[task_id] = []

            task_id_to_statistics[task_id].append({
                "count": element["count"],
                "summary_result": element["summary_result"]
            })

        submissions_per_task = []

        for task in sorted_tasks:
            _id = task.get_id()
            verdicts = task_id_to_statistics.get(_id, [])
            for verdict in verdicts:
                submissions_per_task.append({
                    "task_id": _id,
                    "summary_result": verdict["summary_result"],
                    "count": verdict["count"]
                })

        return 200, submissions_per_task
