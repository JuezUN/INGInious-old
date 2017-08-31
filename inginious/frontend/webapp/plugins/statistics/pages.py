import web
import posixpath
import urllib
import os
import json
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
        total_submissions = self.database.submissions.count({"grade": { "$gte": 90}})

        return (
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).main(username, total_users,
                total_submissions)
        )


class UserStatisticsPage(INGIniousAuthPage):
    def GET_AUTH(self, *args, **kwargs):
        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("static/statistics/js/user_statistics.js")

        grades_per_task_json = self.grade_per_task()
        attempts_per_task_json = self.attempts_per_task()

        return(
            self.template_helper
                .get_custom_renderer(_BASE_RENDERER_PATH)
                .user_statistics(
                    grades_per_task_json, attempts_per_task_json
                )
        )

    def grade_per_task(self):
        user_tasks = self.user_tasks_information()

        data_dict = {
            "x": user_tasks["submissions_date"],
            "y": user_tasks["grades"],
            "text": user_tasks["task_names"]
        }

        return json.dumps(data_dict)

    def attempts_per_task(self):
        user_tasks = self.user_tasks_information()

        data_dict = {
            "x": user_tasks["submissions_date"],
            "y": user_tasks["times_tried"],
            "text": user_tasks["task_names"]
        }

        return json.dumps(data_dict)

    def user_tasks_information(self):
        username = self.user_manager.session_username()
        user_tasks = self.database.user_tasks.find({"username": username})

        info_dict = {
            "submissions_date": [],
            "grades": [],
            "task_names": [],
            "times_tried": []
        }

        for user_task in user_tasks:
            submission = self.database.submissions.find_one({"_id": user_task["submissionid"] })

            info_dict["submissions_date"].append(str(submission["submitted_on"]))
            info_dict["grades"].append(str(user_task["grade"]))
            info_dict["task_names"].append(str(user_task["taskid"]))
            info_dict["times_tried"].append(str(user_task["tried"]))

        return info_dict
