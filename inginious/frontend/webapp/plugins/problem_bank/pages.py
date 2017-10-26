import web
import uuid

import inginious.frontend.webapp.pages.api._api_page as api
from inginious.frontend.webapp.plugins.utils import AdminApi
from inginious.common.exceptions import TaskNotFoundException, InvalidNameException
from inginious.common.course_factory import CourseNotFoundException, CourseUnreadableException, InvalidNameException
from inginious.common.filesystems.provider import NotFoundException


class CopyTaskApi(AdminApi):
    def API_POST(self):
        parameters = web.input()
        target_id = self.get_mandatory_parameter(parameters, "target_id")
        bank_id = self.get_mandatory_parameter(parameters, "bank_id")
        task_id = self.get_mandatory_parameter(parameters, "task_id")

        target_course = self.get_course_and_check_rights(target_id)
        target_course_tasks_ids = [key for key in target_course.get_tasks()]

        copy_id = str(uuid.uuid4())
        while copy_id in target_course_tasks_ids:
            copy_id = str(uuid.uuid4())

        try:
            bank_course = self.course_factory.get_course(bank_id)
        except (CourseNotFoundException, InvalidNameException, CourseUnreadableException):
            raise api.APIError(400, {"error": "Invalid bank"})

        try:
            task = bank_course.get_task(task_id)
        except (TaskNotFoundException, InvalidNameException):
            raise api.APIError(400, {"error": "Invalid task"})

        target_fs = self.course_factory.get_course_fs(target_id)

        try:
            target_fs.copy_to(task.get_fs().prefix, copy_id)
        except NotFoundException:
            raise api.APIError(400, {"error": "the copy_id made an invalid path"})

        return 200, {"message": "Copied succesfully"}


class ManageBanksCoursesApi(AdminApi):
    def get_course_id(self):
        parameters = web.input()
        course_id = self.get_mandatory_parameter(parameters, "course_id")
        self.get_course_and_check_rights(course_id)
        return course_id

    def already_bank(self, course_id):
        return self.database.problem_banks.find({"courseid": {"$eq": course_id}}).count() != 0

    def API_GET(self):
        return 200, [bank_id["courseid"] for bank_id in self.database.problem_banks.find()]

    def API_POST(self):
        course_id = self.get_course_id()
        try:
            self.database.problem_banks.insert({"courseid": course_id})
        except:
            return 200, {"message": "Course already a bank"}

        return 200, {"message": "Bank created successfully"}

    def API_DELETE(self):
        course_id = self.get_course_id()
        if self.already_bank(course_id):
            self.database.problem_banks.remove({"courseid": {"$eq": course_id}}, True)
            return 200, {"message": "Bank removed successfully"}
        else:
            return 404, {"message": "No bank found"}
