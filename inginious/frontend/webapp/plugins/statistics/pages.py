import web
import posixpath
import urllib
import os
import collections
import inginious.frontend.webapp.pages.api._api_page as api

from inginious.frontend.webapp.pages.api._api_page import APIAuthenticatedPage
from inginious.frontend.webapp.pages.utils import INGIniousAuthPage, INGIniousPage
from inginious.frontend.webapp.pages.course_admin.utils import INGIniousAdminPage
from inginious.common.filesystems.local import LocalFSProvider
from inginious.common.course_factory import CourseNotFoundException, CourseUnreadableException, InvalidNameException
from .utils import convert_task_dict_to_sorted_list, project_detail_user_tasks


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
        self.template_helper.add_javascript("/static/statistics/js/user_statistics.js")
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

        course = self.course_factory.get_course(course_id)
        course_tasks = course.get_tasks()
        sorted_tasks = sorted(course_tasks.values(), key=lambda task: task.get_order())

        task_id_to_statistics = {}
        for element in best_submissions:
            task_id = element["taskid"]

            if task_id not in task_id_to_statistics:
                task_id_to_statistics[task_id] = []

            task_id_to_statistics[task_id].append({
                "grade": element["grade"],
                "result": element["result"],
                "taskid": element["taskid"],
                "tried": element["tried"]
            })

        best_submissions = []

        for task in sorted_tasks:
            _id = task.get_id()
            task_name = task.get_name()
            verdicts = task_id_to_statistics.get(_id, [])
            for verdict in verdicts:
                best_submissions.append({
                    "taskid": _id,
                    "taskname": task_name,
                    "grade": verdict["grade"],
                    "result": verdict["result"],
                    "tried": verdict["tried"]
                    
                })

        return 200, best_submissions
    

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
            task_name = task.get_name()
            verdicts = task_id_to_statistics.get(_id, [])
            for verdict in verdicts:
                submissions_per_task.append({
                    "task_id": _id,
                    "task_name": task_name,
                    "summary_result": verdict["summary_result"],
                    "count": verdict["count"]
                })

        return 200, submissions_per_task


def statistics_course_admin_menu_hook(course):
    return "statistics", '<i class="fa fa-bar-chart" aria-hidden="true"></i> Course statistics'



class StatisticsAdminApi(api.APIAuthenticatedPage):
    def get_course_and_check_rights(self, course_id):
        try:
            course = self.course_factory.get_course(course_id)
        except (CourseNotFoundException, InvalidNameException, CourseUnreadableException):
            raise api.APIError(400, {"error": "Invalid course"})

        if not self.user_manager.has_staff_rights_on_course(course):
            raise api.APIError(400, {"error": "Invalid course"})

        return course

    def get_mandatory_parameter(self, parameters, parameter_name):
        if parameter_name not in parameters:
            raise api.APIError(400, {"error": parameter_name + " is mandatory"})

        return parameters[parameter_name]


class BestSubmissionsByVerdictApi(StatisticsAdminApi):

    def get_best_statistics_by_verdict(self, course):
        course_id = course.get_id()
        best_statistics_by_verdict = self.database.user_tasks.aggregate([
                {
                    "$match":
                        {
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
                    "$group": {
                        "_id": {"summary_result": "$submission.custom.summary_result",
                                "taskid": "$taskid"},
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "task_id": "$_id.taskid",
                        "summary_result": "$_id.summary_result",
                        "count": 1
                    }
                },
                {
                    "$match":
                        {
                            "summary_result": {"$ne": None}
                        }
                }
            ])

        return best_statistics_by_verdict

    def API_GET(self):
        parameters = web.input()

        course_id = self.get_mandatory_parameter(parameters, "course_id")
        course = self.get_course_and_check_rights(course_id)

        best_statistics_by_verdict = self.get_best_statistics_by_verdict(course)
        course_tasks = course.get_tasks()
        sorted_tasks = sorted(course_tasks.values(), key=lambda task: task.get_order())

        task_id_to_statistics = {}
        for element in best_statistics_by_verdict:
            task_id = element["task_id"]

            if task_id not in task_id_to_statistics:
                task_id_to_statistics[task_id] = []

            task_id_to_statistics[task_id].append({
                "count": element["count"],
                "summary_result": element["summary_result"]
            })

        best_statistics_by_verdict = []

        for task in sorted_tasks:
            _id = task.get_id()
            task_name = task.get_name()
            verdicts = task_id_to_statistics.get(_id, [])
            for verdict in verdicts:
                best_statistics_by_verdict.append({
                    "task_id": _id,
                    "task_name": task_name,
                    "summary_result": verdict["summary_result"],
                    "count": verdict["count"]
                })
        return 200, best_statistics_by_verdict


class SubmissionsByVerdictApi(StatisticsAdminApi):

    def get_statistics_by_verdict(self, course):
        course_id = course.get_id()
        statistics_by_verdict = self.database.submissions.aggregate([
            {"$match": {"courseid": course_id, "custom.summary_result": {"$ne": None}}},
            {
                "$group": {
                    "_id": {"summary_result": "$custom.summary_result",
                            "task_id": "$taskid"
                            },
                    "count": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "task_id": "$_id.task_id",
                    "summary_result": "$_id.summary_result",
                    "count": 1
                }
            }
        ])

        return statistics_by_verdict

    def API_GET(self):
        parameters = web.input()

        course_id = self.get_mandatory_parameter(parameters, "course_id")
        course = self.get_course_and_check_rights(course_id)

        statistics_by_verdict = self.get_statistics_by_verdict(course)
        course_tasks = course.get_tasks()
        sorted_tasks = sorted(course_tasks.values(), key=lambda task: task.get_order())

        task_id_to_statistics = {}
        for element in statistics_by_verdict:
            task_id = element["task_id"]

            if task_id not in task_id_to_statistics:
                task_id_to_statistics[task_id] = []

            task_id_to_statistics[task_id].append({
                "count": element["count"],
                "summary_result": element["summary_result"]
            })


        statistics_by_verdict = []

        for task in sorted_tasks:
            _id = task.get_id()
            task_name = task.get_name()
            verdicts = task_id_to_statistics.get(_id, [])
            for verdict in verdicts:
                statistics_by_verdict.append({
                    "task_id": _id,
                    "task_name": task_name,
                    "summary_result": verdict["summary_result"],
                    "count": verdict["count"]
                })
        return 200, statistics_by_verdict


class GradeCountStatisticsApi(StatisticsAdminApi):
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

        task_id_to_statistics = collections.defaultdict(list)
        for element in statistics_by_grade:
            task_id = element["_id"]["task"]

            task_id_to_statistics[task_id].append({
                "grade": element["_id"]["grade"],
                "count": element["count"]
            })

        return task_id_to_statistics

    def API_GET(self):
        parameters = web.input()

        course_id = self.get_mandatory_parameter(parameters, 'course_id')
        course = self.get_course_and_check_rights(course_id)

        grade_count_statistics = self._compute_grade_count_statistics(course_id)
        statistics_by_grade_count = convert_task_dict_to_sorted_list(course, grade_count_statistics, 'grades',
                                                                     include_all_tasks=True)

        return 200, statistics_by_grade_count


class GradeCountStatisticsDetailApi(StatisticsAdminApi):
    def _compute_details(self, course_id, grade, task_id):
        user_tasks = self.database.user_tasks.aggregate([
            {"$match": {"$and": [{"courseid": course_id}, {"taskid": task_id}, {"grade": {"$lte": grade}},
                                 {"grade": {"$gt": grade - 1}}]}},
            {
                "$lookup": {
                    "from": "submissions",
                    "localField": "submissionid",
                    "foreignField": "_id",
                    "as": "submission"
                }
            },
            {
                "$unwind":
                    {
                        "path": "$submission",
                        "preserveNullAndEmptyArrays": True
                    }
            },
            {
                "$sort": collections.OrderedDict([
                    ("submission.submitted_on", -1),
                    ("username", 1)
                ])
            }
        ])

        return project_detail_user_tasks(user_tasks)

    def API_GET(self):
        parameters = web.input()

        course_id = self.get_mandatory_parameter(parameters, 'course_id')
        self.get_course_and_check_rights(course_id)

        grade = int(self.get_mandatory_parameter(parameters, 'grade'))
        task_id = self.get_mandatory_parameter(parameters, 'task_id')

        submissions = self._compute_details(course_id, grade, task_id)

        return 200, submissions


class GradeDistributionStatisticsDetailApi(StatisticsAdminApi):
    def _compute_details(self, course_id, task_id):
        user_tasks = self.database.user_tasks.aggregate([
            {"$match": {"$and": [{"courseid": course_id}, {"taskid": task_id}]}},
            {
                "$lookup": {
                    "from": "submissions",
                    "localField": "submissionid",
                    "foreignField": "_id",
                    "as": "submission"
                }
            },
            {
                "$unwind":
                    {
                        "path": "$submission",
                        "preserveNullAndEmptyArrays": True
                    }
            },
            {
                "$sort": collections.OrderedDict([
                    ("submission.submitted_on", -1),
                    ("username", 1)
                ])
            }
        ])

        return project_detail_user_tasks(user_tasks)

    def API_GET(self):
        parameters = web.input()

        course_id = self.get_mandatory_parameter(parameters, 'course_id')
        self.get_course_and_check_rights(course_id)

        task_id = self.get_mandatory_parameter(parameters, 'task_id')

        submissions = self._compute_details(course_id, task_id)

        return 200, submissions

class GradeDistributionStatisticsApi(StatisticsAdminApi):
    def _compute_grade_distribution_statistics(self, course_id):
        all_grades = self.database.user_tasks.find(
            {"courseid": course_id},
            {"taskid": 1, "grade": 1, "username": 1}
        )

        grouped_grades = collections.defaultdict(list)
        for item in all_grades:
            task_id = item["taskid"]

            grouped_grades[task_id].append(item["grade"])

        return grouped_grades


    def API_GET(self):
        parameters = web.input()

        course_id = self.get_mandatory_parameter(parameters, 'course_id')
        course = self.get_course_and_check_rights(course_id)

        grade_distribution_statistics = self._compute_grade_distribution_statistics(course_id)
        statistics_by_grade_distribution = convert_task_dict_to_sorted_list(course, grade_distribution_statistics,
                                                                            'grades', include_all_tasks=True)

        return 200, statistics_by_grade_distribution


class CourseAdminStatisticsPage(INGIniousAdminPage):
    def GET_AUTH(self, course_id):
        course, _ = self.get_course_and_check_rights(course_id)

        self.template_helper.add_javascript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.3.6/papaparse.min.js")
        self.template_helper.add_javascript("https://cdn.plot.ly/plotly-1.30.0.min.js")
        self.template_helper.add_javascript("https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js")
        self.template_helper.add_javascript("/static/statistics/js/statistics.js")
        self.template_helper.add_javascript("/static/statistics/js/course_admin_statistics.js")
        self.template_helper.add_css("/static/statistics/css/statistics.css")

        return (
            self.template_helper.get_custom_renderer(_BASE_RENDERER_PATH).course_admin_statistics(
                course)
        )
