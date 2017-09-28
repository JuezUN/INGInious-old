from .pages import StaticResourcePage

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page(r'/static/statistics/(.*)', StaticResourcePage)
