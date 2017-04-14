# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.

""" Some common functions for logging """
import logging

def init_logging(log_level=logging.DEBUG):
    """
    Init logging
    :param log_level: An integer representing the log level or a string representing one
    """
    logger = logging.getLogger("inginious")
    logger.setLevel(log_level)
    ch = logging.StreamHandler()
    ch.setLevel(log_level)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)

def get_course_logger(coursename):
    """
    :param coursename: the course id
    :return: a logger object associated to a specific course
    """
    return logging.getLogger("inginious.course."+coursename)


class CustomLogMiddleware:
    """ WSGI middleware for logging the status in webpy"""

    def __init__(self, app, logger):
        import web
        self.debug_web = web.debug
        self.app = app
        self.logger = logger
        self.format = '%s - - [%s] "%s %s %s" - %s'
        self._web_debug = web.debug

    def __call__(self, environ, start_response):
        def xstart_response(status, response_headers, *args):
            out = start_response(status, response_headers, *args)
            self.log(status, environ)
            return out

        return self.app(environ, xstart_response)

    def log(self, status, environ):
        req = environ.get('PATH_INFO', '_')
        protocol = environ.get('ACTUAL_SERVER_PROTOCOL', '-')
        method = environ.get('REQUEST_METHOD', '-')
        host = "%s:%s" % (environ.get('REMOTE_ADDR', '-'),
                          environ.get('REMOTE_PORT', '-'))
        msg = '%s - "%s %s %s" - %s' % (host, protocol, method, req, status)
        self.logger.info(msg)
