import web
import posixpath
import urllib
import os
import json
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


class StatisticsPage(INGIniousAuthPage):
    def GET_AUTH(self):
        username = self.user_manager.session_username()

        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("static/statistics/js/statistics.js")

        total_users = self.database.users.count()
        total_submissions = self.database.submissions.count({"grade": {"$gte": 90}})

        return (
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).main(username, total_users,
                                                                               total_submissions)
        )


def statistics_course_menu_hook(course, template_helper):
    return """
            <h3>Statistics</h3>
            <a class="list-group-item list-group-item-info"
                href="/my_statistics">
                <i class="fa fa-group fa-fw"></i>
                My Statistics
            </a>"""


class UserStatisticsPage(INGIniousAuthPage):
    def GET_AUTH(self, *args, **kwargs):
        self.template_helper.add_javascript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.3.6/papaparse.min.js")
        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("static/statistics/js/user_statistics.js")

        tries_per_tasks_json = json.dumps(self.get_best_submission(), cls=DateTimeEncoder)

        return (
            self.template_helper
                .get_custom_renderer(_BASE_RENDERER_PATH)
                .user_statistics(tries_per_tasks_json)
        )

    def get_best_submission(self):
        username = self.user_manager.session_username()

        best_submissions = self.database.user_tasks.aggregate([
            {
                "$match":
                    {
                        "username": username
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

        return list(best_submissions)


class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
