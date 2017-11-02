import React from 'react';
import ReactDOM from 'react-dom';
import Autosuggest from 'react-autosuggest';
import { Tabs, Tab } from 'react-bootstrap';
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
                    Tasks
                </Tab>
            </Tabs>
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