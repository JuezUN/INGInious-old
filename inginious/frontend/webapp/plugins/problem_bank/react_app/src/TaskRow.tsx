import * as React from 'react';
import Task from './Task';

export interface TaskRowProps {
  task: Task;
}

class TaskRow extends React.Component<TaskRowProps, {}> {
  public constructor(props: TaskRowProps) {
    super(props);
  }

  public render() {
    return (
      <button type="button" className="list-group-item">
        <b>{this.props.task.courseId + ' - ' + this.props.task.name}</b>
        <br />
        {this.props.task.tags.join(', ')}
      </button>
    );
  }
}

export default TaskRow;
