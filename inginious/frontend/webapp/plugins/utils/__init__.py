import posixpath
import urllib
import web

import inginious.frontend.webapp.pages.api._api_page as api
from inginious.frontend.webapp.pages.utils import INGIniousPage
from inginious.common.course_factory import CourseNotFoundException, CourseUnreadableException, InvalidNameException
from inginious.common.filesystems.local import LocalFSProvider


class AdminApi(api.APIAuthenticatedPage):
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


def create_static_resource_page(base_static_folder):
    class StaticResourcePage(INGIniousPage):
        def GET(self, path):
            path_norm = posixpath.normpath(urllib.parse.unquote(path))

            static_folder = LocalFSProvider(base_static_folder)
            (method, mimetype_or_none, file_or_url) = static_folder.distribute(path_norm, False)

            if method == "local":
                web.header('Content-Type', mimetype_or_none)
                return file_or_url
            elif method == "url":
                raise web.redirect(file_or_url)

            raise web.notfound()

    return StaticResourcePage
