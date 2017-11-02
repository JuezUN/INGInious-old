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
    render() {
        return (
            <button type="button" className="list-group-item">{this.props.name}</button>
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

    render() {
        const inputProps = {
            placeholder: 'Type a course name or course id',
            value: this.state.value,
            onChange: this.onChange
        };

        return (
            <Autosuggest
                suggestions={this.state.suggestions}
                onSuggestionsFetchRequested={({value}) => this.setState({suggestions: this.getSuggestions(value)})}
                onSuggestionsClearRequested={() => this.setState({suggestions: []}) }
                getSuggestionValue={(suggestion) => suggestion.id}
                renderSuggestion={this.renderSuggestion}
                inputProps={inputProps}
            />
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

    render() {
        let courses = this.state.courses.map((course, i) => {
            return (<BankCourse name={course} key={i} />)
        });

        return (
            <div>
                <div>The following courses are marked as task sources: </div>

                <div className="list-group">{courses}</div>
                <CourseAutosuggest courses={this.state.availableCourses} />
            </div>

        );
    }
}

ReactDOM.render(
    (<BankPage/>),
    document.getElementById('reactRoot')
);