import React from 'react';
import Autosuggest from 'react-autosuggest';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';

class GeneralCourseAutosuggest extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            suggestions: [],
            value: '',
            courses: []
        };
    }

    getSuggestions = (value) => {
        const normalizedValue = value.toUpperCase();
        return this.state.courses.filter((course) => {
            return course.name.toUpperCase().startsWith(normalizedValue) ||
                course.id.toUpperCase().startsWith(normalizedValue);
        });
    };

    renderSuggestion = (suggestion, {query, isHighlighted}) => {
        return (
            <span>{suggestion.name}</span>
        );
    };

    onChange = (event, { newValue }) => {
        this.setState({
            value: newValue
        });
    };

    updateAvailableCoursesAsync() {
        $.getJSON("/plugins/problems_bank/api/available_courses").then((courses) => {
            this.setState({
                courses
            });
        });
    }

    componentDidMount() {
        this.updateAvailableCoursesAsync()
    }

    addToCourse = () => {
        let target_id = this.state.value;
        let task_id = this.props.task_info.task_id;
        let bank_id = this.props.task_info.course_id;

        let updateParent = this.props.callbackParent;

        $.post( "/plugins/problems_bank/api/copy_task", {"target_id": target_id, "task_id": task_id, "bank_id": bank_id} ,function( data ) {
            updateParent(data);
        });

    };

    render() {
        const inputProps = {
            placeholder: 'Type a course name or course id',
            value: this.state.value,
            onChange: this.onChange
        };

        return (
            <Row>
              <Col md={4}>
                  <Autosuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={({value}) => this.setState({suggestions: this.getSuggestions(value)})}
                    onSuggestionsClearRequested={() => this.setState({suggestions: []}) }
                    getSuggestionValue={(suggestion) => suggestion.id}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                  />
              </Col>
              <Col md={4}>
                  <button onClick={this.addToCourse} class="btn btn-primary">
                    Copy task
                  </button>
              </Col>
              <Col mdHidden={6}>
              </Col>
            </Row>
        );
    }
}
export default GeneralCourseAutosuggest;