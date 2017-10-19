import web

from inginious.frontend.webapp.plugins.utils import AdminApi


class CopyTaskApi(AdminApi):
    def API_GET(self):
        parameters = web.input()
        target_id = self.get_mandatory_parameter(parameters, "target_id")
        bank_id = self.get_mandatory_parameter(parameters, "bank_id")
        task_id = self.get_mandatory_parameter(parameters, "task_id")

        copy_id = parameters["copy_id"] if "copy_id" in parameters else task_id

        target_course = self.get_course_and_check_rights(target_id)
        bank_course = self.get_course_and_check_rights(bank_id)

        task = bank_course.get_task(task_id)
        target_fs = self.course_factory.get_course_fs(target_id)
        target_fs.copy_to(task.get_fs().prefix, copy_id)

        return 200, {"message": "Copied succesfully"}
