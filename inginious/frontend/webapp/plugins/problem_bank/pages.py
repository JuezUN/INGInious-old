import web

import inginious.frontend.webapp.pages.api._api_page as api
from inginious.frontend.webapp.plugins.utils import AdminApi
from inginious.common.exceptions import TaskNotFoundException
from inginious.common.course_factory import CourseNotFoundException, CourseUnreadableException, InvalidNameException
from inginious.common.filesystems.provider import NotFoundException

class CopyTaskApi(AdminApi):
    def API_GET(self):
        parameters = web.input()
        target_id = self.get_mandatory_parameter(parameters, "target_id")
        bank_id = self.get_mandatory_parameter(parameters, "bank_id")
        task_id = self.get_mandatory_parameter(parameters, "task_id")

        copy_id = parameters["copy_id"] if ("copy_id" in parameters and parameters["copy_id"] != "") else task_id

        target_course = self.get_course_and_check_rights(target_id)

        try:
            bank_course = self.course_factory.get_course(bank_id)
        except (CourseNotFoundException, InvalidNameException, CourseUnreadableException):
            raise api.APIError(400, {"error": "Invalid bank"})

        try:
            task = bank_course.get_task(task_id)
        except TaskNotFoundException:
            raise api.APIError(400, {"error": "Invalid task"})

        target_fs = self.course_factory.get_course_fs(target_id)

        try:
            target_fs.copy_to(task.get_fs().prefix, copy_id)
        except NotFoundException:
            raise api.APIError(400, {"error": "the copy_id made an invalid path"})

        return 200, {"message": "Copied succesfully"}
