import web
import inginious.frontend.webapp.pages.api._api_page as api
from inginious.frontend.webapp.pages.api._api_page import APIAuthenticatedPage
from inginious.common.course_factory import CourseNotFoundException, InvalidNameException, CourseUnreadableException


class TagsApi(APIAuthenticatedPage):
    def API_GET(self):
        self.validate_parameters()
        return self.tags()

    def validate_parameters(self):
        user_input = web.input(user_input=None).user_input

        if user_input is None:
            raise api.APIError(400, {"error": "user_input is mandatory"})

    def tags(self):
        user_input = web.input().user_input

        pattern = ".*" + user_input + ".*"

        suggested_tags = self.database.tasks_cache.aggregate([
            {
                "$unwind": {"path": "$tags"}
            },
            {
                "$match": {"tags": {"$regex": pattern}}
            },
            {
                "$group":
                    {
                        "_id": 0,
                        "tags": {"$addToSet": "$tags"}
                    }
            },
            {
                "$project": {
                    "_id": 0,
                    "tags": "$tags"
                }
            }
        ])

        return 200, list(suggested_tags)