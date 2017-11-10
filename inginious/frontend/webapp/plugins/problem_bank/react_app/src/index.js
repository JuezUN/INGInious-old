import React from 'react';
import ReactDOM from 'react-dom';
import Autosuggest from 'react-autosuggest';
import { Tabs, Tab, Modal, Button } from 'react-bootstrap';
import './index.css';

/*global $:false*/

class BankPage extends React.Component {
    render() {
        return (
            <Tabs defaultActiveKey={1} id="bank-page-tabs">
                <Tab eventKey={1} title="Courses">
                    <BankCourseList/>
                </Tab>
                <Tab eventKey={2} title="Tasks">
                    <TaskList/>
                </Tab>
            </Tabs>
        );
    }
}

class TaskList extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            tasks: []
        };
    }

    updateTasksAsync() {
        $.getJSON("/plugins/problems_bank/api/bank_tasks").then((tasks) => {
            this.setState({
                tasks
            });
        });
    }

    componentDidMount() {
        this.updateTasksAsync()
    }

    render() {
        let tasks = this.state.tasks.map((task, i) => {
            return (<Task task_info={task} key={i}/>)
        });

        return (
            <div>
                <div>The following tasks are available for copiyng: </div>

                <div className="list-group">{tasks}</div>
            </div>
        );
    }
}

class Task extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            showModal: false
        };
    }


    open = () => {
        this.setState({ showModal: true });
    }

    close = () => {
        this.setState({ showModal: false });
    }

    render() {
        return (
            <div>
                <button type="button" className="list-group-item" onClick={this.open}>{this.props.task_info.id}
                </button>
                <Modal className="modal-container"
                    show={this.state.showModal}
                    onHide={this.close}
                    animation={true}
                    bsSize="large">

                    <Modal.Header closeButton>
                        <Modal.Title>Modal title</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        Hey jude
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={this.close}>Close</Button>
                        <Button bsStyle="primary">Save changes</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

class BankCourse extends React.Component {

    deleteCourse = () => {
        let course_id = this.props.name
        let updateParent = this.props.callbackParent

        $.ajax({
            url: '/plugins/problems_bank/api/bank_courses?' + $.param({"course_id": course_id}),
            type: "DELETE",
            success: function(data){
                console.log(data)
                updateParent()
            }
        })
    }

    render() {
        return (
            <div>
                <button type="button" className="list-group-item">{this.props.name}
                <a class="pull-right" onClick={this.deleteCourse} >
                    <span class="glyphicon glyphicon-remove"></span>
                </a>
              </button>
            </div>
        );
    }
}

class CourseAutosuggest extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            suggestions: [],
            value: ''
        };
    }

    getSuggestions = (value) => {
        const normalizedValue = value.toUpperCase();
        return this.props.courses.filter((course) => {
            return course.name.toUpperCase().startsWith(normalizedValue) ||
                course.id.toUpperCase().startsWith(normalizedValue);
        });
    }

    renderSuggestion = (suggestion, {query, isHighlighted}) => {
        return (
            <span>{suggestion.name}</span>
        );
    }

    onChange = (event, { newValue }) => {
        this.setState({
            value: newValue
        });
    };

    addCourse = () => {
        let course_id = this.state.value
        let updateParent = this.props.callbackParent
        $.post( "/plugins/problems_bank/api/bank_courses", { "course_id": course_id }, function( data ) {
            console.log(data)
            updateParent()
        });
    }

    render() {
        const inputProps = {
            placeholder: 'Type a course name or course id',
            value: this.state.value,
            onChange: this.onChange
        };

        return (
            <div>
                <Autosuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={({value}) => this.setState({suggestions: this.getSuggestions(value)})}
                    onSuggestionsClearRequested={() => this.setState({suggestions: []}) }
                    getSuggestionValue={(suggestion) => suggestion.id}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
                <button onClick={this.addCourse} class="btn btn-primary">
                    Add course to bank
                </button>
            </div>
        );
    }
}

class BankCourseList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            courses: [],
            courseIdToAdd: '',
            availableCourses: []
        };
    }

    updateBankCoursesAsync() {
        $.getJSON("/plugins/problems_bank/api/bank_courses").then((courses) => {
            this.setState({
                courses
            });
        });
    }

    updateAvailableCoursesAsync() {
        $.getJSON("/plugins/problems_bank/api/available_courses").then((availableCourses) => {
            this.setState({
                availableCourses
            });
        });
    }

    componentDidMount() {
        this.updateBankCoursesAsync()
        this.updateAvailableCoursesAsync()
    }

    onChildChanged(){
        this.updateBankCoursesAsync()
        this.updateAvailableCoursesAsync()
    }

    render() {
        let courses = this.state.courses.map((course, i) => {
            return (<BankCourse name={course} key={i} callbackParent={() => this.onChildChanged()}/>)
        });

        return (
            <div>
                <div>The following courses are marked as task sources: </div>

                <div className="list-group">{courses}</div>
                <CourseAutosuggest courses={this.state.availableCourses}
                                   callbackParent={() => this.onChildChanged()}/>
            </div>

        );
    }
}

ReactDOM.render(
    (<BankPage/>),
    document.getElementById('reactRoot')
);