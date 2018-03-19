import React from "react";
import { Well } from 'react-bootstrap';
import './index.css';
import $ from 'jquery';

import UltimatePagination from './ultimate_pagination';
import BankCourse from './bank_course'
import CourseAutosuggest from './course_autosuggest'


class BankCourseList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            courses: [],
            courseIdToAdd: '',
            availableCourses: [],
            page: 1,
            total_pages: 1
        };
        this.onPageChange = this.onPageChange.bind(this);
    }

    updateBankCoursesAsync() {
        $.getJSON("/plugins/problems_bank/api/bank_courses").then((courses) => {
            this.setState({
                courses
            });
            if(Math.ceil(this.state.courses.length / this.props.limit) === 0){
                this.setState({
                    total_pages: 1,
                    page: 1
                });
            }else{
                this.setState({
                    total_pages: Math.ceil(this.state.courses.length / this.props.limit),
                    page: 1
                });
            }
        });
    }

    updateTasksAsync() {
        let updateParent = this.props.callbackParent;
        $.getJSON("/plugins/problems_bank/api/bank_tasks").then((tasks) => {
            updateParent(tasks);
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
        this.updateBankCoursesAsync();
        this.updateAvailableCoursesAsync();
        this.updateTasksAsync();
    }

    onChildChanged(){
        this.updateBankCoursesAsync();
        this.updateAvailableCoursesAsync();
        this.updateTasksAsync();
    }

    onPageChange(page) {
        this.setState({page});
    }

    render() {
        let courses = this.state.courses.map((course, i) => {
            if(i >= ((this.state.page - 1) * this.props.limit) && i < (this.state.page * this.props.limit)) {
                return (<BankCourse name={course} key={i} callbackParent={() => this.onChildChanged()}/>)
            }
        });

        return (
            <div>

                <Well bsSize="small">
                    <h5>Select course to become in bank</h5>
                    <CourseAutosuggest courses={this.state.availableCourses}
                                       callbackParent={() => this.onChildChanged()}/>
                </Well>

                <div>The following courses are marked as task sources: </div>

                <div className="list-group">{courses}</div>

                <UltimatePagination
                     currentPage={this.state.page}
                     totalPages={this.state.total_pages}
                     onChange={this.onPageChange}
                />

            </div>

        );
    }
}

export default BankCourseList;