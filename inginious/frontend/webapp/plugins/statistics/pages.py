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

        username = self.user_manager.session_username()
        submissions = self.database.submissions.find({"username": username}).sort("submitted_on")

        json_data = {"x": [], "y": []}
        for submission in submissions:
            json_data["x"].append(str(submission["submitted_on"]))
            json_data["y"].append(str(submission["grade"]))

        submission_per_task_json = self.submission_per_task()

        return(
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).user_statistics(json.dumps(json_data),submission_per_task_json)
        )

    def submission_per_task(self):

        username = self.user_manager.session_username()
        user_tasks = self.database.user_tasks.find({"username": username})

        json_data = {"x": [], "y": [], "text":[]}
        for user_task in user_tasks:
            submission = self.database.submissions.find_one({"_id": user_task["submissionid"] })
            json_data["x"].append(str(submission["submitted_on"]))
            json_data["y"].append(str(user_task["tried"]))
            json_data["text"].append(str(submission["taskid"]))

        return json.dumps(json_data)
