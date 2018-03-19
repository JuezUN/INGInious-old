import React from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';
import './index.css';
import BankCourseList from './bank_course_list';
import TaskList from './task_list';
/*global $:false*/

class BankPage extends React.Component {

     constructor(props) {
        super(props);

        this.state = {
            tasks: []
        };

    }

    onChildChanged(tasks){
        this.setState({
            tasks
        })
    }

    render() {
        return (
            <Tabs defaultActiveKey={1} id="bank-page-tabs">
                <Tab eventKey={1} title="Courses">
                    <BankCourseList limit={10} callbackParent={(tasks) => this.onChildChanged(tasks)} />
                </Tab>
                <Tab eventKey={2} title="Tasks">
                    <TaskList refreshTasks={this.state.tasks} limit={10}/>
                </Tab>
            </Tabs>
        );
    }
}

ReactDOM.render(
    (<BankPage/>),
    document.getElementById('reactRoot')
);