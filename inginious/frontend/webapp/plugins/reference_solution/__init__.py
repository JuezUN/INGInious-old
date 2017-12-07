import json
from inginious.frontend.common.task_problems import DisplayableBasicCodeProblem

_BASE_RENDERER_PATH = 'frontend/webapp/plugins/reference_solution'
_AVAILABLE_LANGUAGES = DisplayableBasicCodeProblem._available_languages


def reference_solution_tab(course, taskid, task_data, template_helper):

    tab_id = 'tab_reference_solution'
    link = '<i class="fa fa-edit fa-fw"></i>&nbsp; Reference Solution'
    content = template_helper.get_custom_renderer(_BASE_RENDERER_PATH,
                                                  layout=False).reference_solution(course, taskid, task_data,
                                                                                   _AVAILABLE_LANGUAGES)

    return tab_id, link, content


def on_task_editor_submit(course, taskid, task_data, task_fs):
    selected_language = task_data.get("reference_solution_language", None)
    if selected_language is not None and selected_language not in _AVAILABLE_LANGUAGES:
        return json.dumps({"status": "error", "message": "The reference solution language is not valid"})


def init(plugin_manager, course_factory, client, config):
    plugin_manager.add_hook('task_editor_tab', reference_solution_tab)
    plugin_manager.add_hook('task_editor_submit', on_task_editor_submit)