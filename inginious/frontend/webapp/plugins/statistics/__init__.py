from .pages import StatisticsPage, StaticResourcePage, UserStatisticsPage

def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_page("/statistics", StatisticsPage)
    plugin_manager.add_page("/my_statistics", UserStatisticsPage)
    plugin_manager.add_page(r'/static/statistics/(.*)', StaticResourcePage)
