import web

from inginious.frontend.webapp.plugins.utils import AdminApi

class CopyTaskApi(AdminApi):
    def API_GET(self):
        return 200, web.input()