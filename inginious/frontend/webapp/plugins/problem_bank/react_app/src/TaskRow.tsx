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
    return <div>{this.props.task.name}</div>;
  }
}

export default TaskRow;
