interface Task {
    id: string;
    name: string;
    author: string;
    context: string;
    tags: string[];   
}

export default Task;

// dict = {"course_id": task["course_id"], 
// "task_id": task["task_id"], 
// "task_name": task["task_name"],
// //                         
// "task_author": task["task_author"], 
// "task_context": task["task_context"], 
// "tags": task["tags"]
// }
