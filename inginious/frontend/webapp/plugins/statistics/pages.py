import web
import posixpath
import urllib
import os
import json
from bson.json_util import dumps
from datetime import datetime
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
        self.template_helper.add_javascript("/static/statistics/js/user_statistics.js")
        self.template_helper.add_javascript("/static/statistics/js/statistics.js")

        return (
            self.template_helper
                .get_custom_renderer(_BASE_RENDERER_PATH)
                .user_statistics(course_id)
        )


class UserStatisticsAPI(INGIniousAuthPage):
    def GET_AUTH(self, *args, **kwargs):
        self.ensure_parameters()
        return self.statistics()

    def ensure_parameters(self):
        username = self.user_manager.session_username()
        course_id = web.input(course_id=None).course_id

        if course_id is None:
            raise web.badrequest("400 Bad Request: Missing course_id in the query params")

        try:
            course = self.course_factory.get_course(course_id)
        except:
            raise web.notfound("404 Not found: The course does not exist")

        if not self.user_manager.course_is_user_registered(course, username):
            raise web.forbidden("403 Forbidden: You are not registered in this course")

    def statistics(self):
        return "[]"


class TrialsAndBestGrade(UserStatisticsAPI):
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
                        "grade": 1,
                        "date": "$submission.submitted_on"
                    }
            },
            {
                "$match":
                    {
                        "result": {"$ne": None}
                    }
            }
        ])

        return json.dumps(list(best_submissions), cls=DateTimeEncoder)


class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()

class BarSubmissionsPerTasks(UserStatisticsAPI):
    def statistics(self):
        username = self.user_manager.session_username()
        course_id = web.input().course_id

        submissions_per_task = self.database.submissions.aggregate([
            {"$match":
                {"username": [username],
                "courseid": course_id,
                "custom.summary_result": {"$ne": None}
                }
            },
            {
                "$group": {
                    "_id": {"summary_result": "$custom.summary_result",
                            "task_id": "$taskid"},
                    "count": {"$sum": 1}
                }
            },
            {   "$project": {
                    "_id": 0,
                    "task_id": "$_id.task_id",
                    "summary_result": "$_id.summary_result",
                    "count": 1 }
            },
            {
                "$sort" : { "task_id" : -1}
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

        return dumps(submissions_per_task)
