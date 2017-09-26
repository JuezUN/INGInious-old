import web
import posixpath
import urllib
import os
import json
from inginious.frontend.webapp.pages.utils import INGIniousAuthPage, INGIniousPage
from inginious.common.filesystems.local import LocalFSProvider
from bson.json_util import dumps

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

        submissions_per_task_json = self.submissions_per_task()

        return(
            self.template_helper
                .get_custom_renderer(_BASE_RENDERER_PATH)
                .user_statistics(submissions_per_task_json)
        )

    def user_tasks_information(self):
        username = self.user_manager.session_username()
        user_tasks = self.database.user_tasks.find({"username": username})

        info_dict = {
            "submissions_date": [],
            "grades": [],
            "task_names": [],
            "times_tried": []
        }

        tuples_for_sorting = []

        for user_task in user_tasks:
            user_has_submitted = user_task["submissionid"] is not None

            if user_has_submitted:
                submission = self.database.submissions.find_one({"_id": user_task["submissionid"] })

                date = str(submission["submitted_on"])
                grade = str(user_task["grade"])
                name = str(user_task["taskid"])
                tried = str(user_task["tried"])

                tuples_for_sorting.append((date, grade, name, tried))

        tasks_sorted_by_date = list(zip(*sorted(tuples_for_sorting)))

        info_dict["submissions_date"] = tasks_sorted_by_date[0]
        info_dict["grades"] = tasks_sorted_by_date[1]
        info_dict["task_names"] = tasks_sorted_by_date[2]
        info_dict["times_tried"] = tasks_sorted_by_date[3]

        return info_dict

    def submissions_per_task(self):

        username = self.user_manager.session_username()
        submissions_per_task = self.database.submissions.aggregate([
            {"$match":
                {"username": [username],
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

        return dumps(submissions_per_task)
