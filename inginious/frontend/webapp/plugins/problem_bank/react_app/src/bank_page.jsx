import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import BankCourseList from './bank_course_list';
import TaskList from './task_list';
/*global $:false*/

class BankPage extends React.Component {

     constructor(props) {
        super(props);

        this.state = {
            tasks: [],
            courses: [],
            availableCourses: [],
            pageTasks: 1,
            pageCourses: 1,
            totalPagesTasks: 1,
            totalPagesCourses: 1,
            timer: 0,
            query: ''
        };
        this.limit = 2;
        this.onPageTaskChange = this.onPageTaskChange.bind(this);
        this.onPageCourseChange = this.onPageCourseChange.bind(this);
        this.addTaskToCourse = this.addTaskToCourse.bind(this);
    }

    updateBankCoursesAsync() {
        $.getJSON("/plugins/problems_bank/api/bank_courses").then((courses) => {
            let newCourses = courses;
            let newTotalPages = Math.ceil(newCourses.length / this.limit);
            if(newTotalPages === 0){
                newTotalPages = 1;
            }
            this.setState({
                totalPagesCourses: newTotalPages,
                pageCourses: 1,
                courses: newCourses
            })
        });
    }

    updateTasksAsync() {
        $.getJSON("/plugins/problems_bank/api/bank_tasks").then((tasks) => {
            let newTasksLength = tasks.length;
            let newTotalPages = Math.ceil(newTasksLength / this.limit);
            if(newTotalPages === 0){
                newTotalPages = 1;
            }

            this.setState({
                totalPagesTasks: newTotalPages,
                pageTasks: 1,
                tasks,
                query: '',
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

    updateFilteredTasks(filteredTasks){
        let newTotalPages = Math.ceil(filteredTasks.length / this.limit);
        let newPage = this.state.pageTasks;
        if( newTotalPages >= 1) {
            if( this.state.pageTasks > newTotalPages){
                newPage = newTotalPages
            }
        } else {
            newPage = 1;
            newTotalPages = 1;
        }

        this.setState({
            tasks : filteredTasks,
            pageTasks : newPage,
            totalPagesTasks : newTotalPages
        });
    }

    deleteCourse(course_id){
        $.ajax({
            url: '/plugins/problems_bank/api/bank_courses?' + $.param({"course_id": course_id}),
            type: "DELETE",
            success: (data) => {
                this.updateBankCoursesAsync();
                this.updateAvailableCoursesAsync();
                this.updateTasksAsync();
            }
        });
    };

    handleChangeQuery(e) {
        let newStateQuery = e.target.value; // The new value is required first

        if( newStateQuery === "" ){
            this.updateTasksAsync();
        } else {
            clearTimeout(this.state.timer);
            this.setState({
               query: newStateQuery,
               timer: setTimeout(() => {
                   $.post( "/plugins/problems_bank/api/filter_bank_tasks",
                       { "task_query": this.state.query }, (filtered_tasks) => this.updateFilteredTasks(filtered_tasks));
               }, 250)
            });
        }
    };

    addCourse(courseId){
        $.post( "/plugins/problems_bank/api/bank_courses", { "course_id": courseId }, (data) => {
            this.updateBankCoursesAsync();
            this.updateAvailableCoursesAsync();
            this.updateTasksAsync();
        });
    }

    addTaskToCourse(targetId, taskId, bankId){
        return $.post( "/plugins/problems_bank/api/copy_task", {"target_id": targetId, "task_id": taskId, "bank_id": bankId} ,( data ) => {
            this.updateTasksAsync();
        });
    };


    onPageTaskChange(page) {
        this.setState({pageTasks: page});
    }
    onPageCourseChange(page) {
        this.setState({pageCourses: page});
    }

    componentWillMount(){
        this.updateBankCoursesAsync();
        this.updateAvailableCoursesAsync();
        this.updateTasksAsync();
    }

    render() {
        return (
            <Tabs defaultActiveKey={1} id="bank-page-tabs">
                <Tab eventKey={1} title="Courses">
                    <BankCourseList
                        limit={this.limit}
                        courses={this.state.courses}
                        availableCourses={this.state.availableCourses}
                        page={this.state.pageCourses}
                        totalPages={this.state.totalPagesCourses}
                        callbackUpdateTask={() => this.updateTasksAsync()}
                        callbackUpdateBank={() => this.updateBankCoursesAsync()}
                        callbackUpdateAvailable={() => this.updateAvailableCoursesAsync()}
                        callbackOnPageChange={(page) => this.onPageCourseChange(page)}
                        callbackOnDeleteCourse={(course_id) => this.deleteCourse(course_id)}
                        callbackAddCourse={(courseId) => this.addCourse(courseId)}
                    />
                </Tab>
                <Tab eventKey={2} title="Tasks">
                    <TaskList
                        tasks={this.state.tasks}
                        limit={this.limit}
                        query={this.state.query}
                        page={this.state.pageTasks}
                        totalPages={this.state.totalPagesTasks}
                        courses={this.state.availableCourses}
                        callbackOnPageChange={(page) => this.onPageTaskChange(page)}
                        callbackUpdateTasks={() => this.updateTasksAsync()}
                        callbackHandleChangeQuery={(e) => this.handleChangeQuery(e)}
                        callBackAddTaskToCourse={this.addTaskToCourse}
                    />
                </Tab>
            </Tabs>
        );
    }
}

export default BankPage;