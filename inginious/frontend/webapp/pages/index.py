# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.

""" Index page """
from collections import OrderedDict

import web

from inginious.frontend.webapp.pages.utils import INGIniousAuthPage


class IndexPage(INGIniousAuthPage):
    """ Index page """

    def GET_AUTH(self):  # pylint: disable=arguments-differ
        """ Display main course list page """
        return self.show_page(None)

    def POST_AUTH(self):  # pylint: disable=arguments-differ
        """ Parse course registration or course creation and display the course list page """

        username = self.user_manager.session_username()
        realname = self.user_manager.session_realname()
        email = self.user_manager.session_email()

        user_input = web.input()
        success = None

        # Handle registration to a course
        if "register_courseid" in user_input and user_input["register_courseid"] != "":
            try:
                course = self.course_factory.get_course(user_input["register_courseid"])
                if not course.is_registration_possible(username, realname, email):
                    success = False
                else:
                    success = self.user_manager.course_register_user(course, username, user_input.get("register_password", None))
            except:
                success = False
        elif "new_courseid" in user_input and self.user_manager.user_is_superadmin():
            try:
                courseid = user_input["new_courseid"]
                self.course_factory.create_course(courseid, {"name": courseid, "accessible": False})
                success = True
            except:
                success = False

        return self.show_page(success)

    def show_page(self, success):
        """  Display main course list page """
        username = self.user_manager.session_username()
        realname = self.user_manager.session_realname()
        email = self.user_manager.session_email()

        all_courses = self.course_factory.get_all_courses()

        # Display
        open_courses = {courseid: course for courseid, course in all_courses.items()
                        if self.user_manager.course_is_open_to_user(course, username, False)}
        open_courses = OrderedDict(sorted(iter(open_courses.items()), key=lambda x: x[1].get_name()))

        last_submissions = self.submission_manager.get_user_last_submissions(5, {"courseid": {"$in": list(open_courses.keys())}})
        except_free_last_submissions = []
        for submission in last_submissions:
            try:
                submission["task"] = open_courses[submission['courseid']].get_task(submission['taskid'])
                except_free_last_submissions.append(submission)
            except:
                pass

        registerable_courses = {courseid: course for courseid, course in all_courses.items() if
                                not self.user_manager.course_is_open_to_user(course, username, False) and
                                course.is_registration_possible(username, realname, email)}

        registerable_courses = OrderedDict(sorted(iter(registerable_courses.items()), key=lambda x: x[1].get_name()))

        return self.template_helper.get_renderer().main(open_courses, registerable_courses, except_free_last_submissions, success)
