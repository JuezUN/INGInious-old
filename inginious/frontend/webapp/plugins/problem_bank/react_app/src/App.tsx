import * as React from 'react';
import Task from './Task';
import TaskRow from './TaskRow';
import './App.css';

class App extends React.Component {
  render() {
    const someTask: Task = {
      id: 'someId',
      name: 'language tasks!',
      author: 'andres rondon',
      context: 'n/a',
      tags: ['cpp', 'datastructures']
    };

    return (
      <TaskRow task={someTask}/>
    );
  }
}

export default App;
