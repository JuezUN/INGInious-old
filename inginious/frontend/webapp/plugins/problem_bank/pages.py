import web

from inginious.frontend.webapp.plugins.utils import AdminApi


class ManageBanksCoursesApi(AdminApi):
    def get_course_id(self):
        parameters = web.input()
        course_id = self.get_mandatory_parameter(parameters, "course_id")
        self.get_course_and_check_rights(course_id)

        return course_id

    def API_POST(self):
        course_id = self.get_course_id()
        self.database.problem_banks.insert({"courseid": course_id})

        return 200, {"message : Bank created successfully"}

    def API_DELETE(self):
        course_id = self.get_course_id()
        self.database.problem_banks.remove({"courseid": { "$eq": course_id }}, True )

        return 200, {"message : Bank created successfully"}
