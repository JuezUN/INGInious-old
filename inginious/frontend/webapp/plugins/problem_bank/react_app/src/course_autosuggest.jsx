import React from "react";
import Autosuggest from 'react-autosuggest';
import { Row, Col } from 'react-bootstrap';
import $ from 'jquery';
import './index.css';

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

    addCourse = () => {
        let course_id = this.state.value;
        let updateParent = this.props.callbackParent;
        $.post( "/plugins/problems_bank/api/bank_courses", { "course_id": course_id }, function( data ) {
            updateParent()
        });
        this.setState({
            value: ''
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
              <Col md={3}>
                  {/*<A*/}
                  {/*suggestions={this.state.suggestions}*/}
                  {/*suggestionsFetch={({value}) => this.setState({suggestions: this.getSuggestions(value)})}*/}
                  {/*suggestionsClear={() => this.setState({suggestions: []})}*/}
                  {/*inputProps={inputProps}*/}
                  {/*courses={this.props.courses}*/}
                  {/*/>*/}
                <Autosuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={({value}) => this.setState({suggestions: this.getSuggestions(value)})}
                    onSuggestionsClearRequested={() => this.setState({suggestions: []}) }
                    getSuggestionValue={(suggestion) => suggestion.id}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
              </Col>
              <Col md={2}>
                <button onClick={this.addCourse} className="btn btn-primary">
                    Add course to bank
                </button>
              </Col>
              <Col mdHidden={5}>
              </Col>
              <Col mdHidden={2}>
              </Col>
            </Row>
        );
    }
}
export default CourseAutosuggest;
