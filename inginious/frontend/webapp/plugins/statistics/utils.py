

def convert_task_dict_to_sorted_list(course, task_dict, key_name, include_task_id=True, include_task_name=True,
                                     include_all_tasks=False):
    """
    Converts a task dictionary (where the key is the task id) to a list sorted by the task order, where each element
    is a dictionary describing the task as follows:
    {
        "task_id": A string with the task id (included if include_task_id is True),
        "task_name": A string with the task name (included if include_task_name is True),
        key_name: The value of task_dict[task_id] for this task
    }

    :param course: The course where the task order will be extracted from
    :param task_dict: The dictionary to be converted
    :param key_name: The name of the key for the task_dict values in each task description
    :param include_task_id: Whether to include or not the task id in the task description
    :param include_task_name: Whether to include or not the task name in the task description
    :param include_all_tasks: If True, an element will be generated for each of the course tasks. In this case,
        task_dict should be a collections.default_dict to avoid KeyError.

    :return: A list with the tasks sorted by their course order.
    """

    course_tasks = course.get_tasks()
    sorted_tasks = sorted(course_tasks.values(), key=lambda task: task.get_order())

    def generate_task_element(task):
        element = {}

        if include_task_id:
            element["task_id"] = task.get_id()

        if include_task_name:
            element["task_name"] = task.get_name()

        element[key_name] = task_dict[task.get_id()]

        return element

    return [
        generate_task_element(task) for task in sorted_tasks if include_all_tasks or task.get_id() in task_dict
    ]


def project_detail_user_tasks(user_tasks):
    return [{
        "grade": s["grade"],
        "username": s["username"],
        "submission": project_submission(s["submission"])
    } for s in user_tasks]


def project_submission(submission):
    if submission is None:
        return None

    return {
        "id": str(submission["_id"]),
        "submitted_on": submission["submitted_on"].isoformat(),
        "taskId": submission["taskid"],
        "status": submission["status"],
        "result": submission["result"],
        "grade": submission["grade"],
        "summary_result": submission.get("custom", {}).get("summary_result", None)
    }