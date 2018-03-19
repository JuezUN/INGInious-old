import React from "react";
import { FormControl } from 'react-bootstrap';
import $ from 'jquery';
import Task from './task';
import CustomAlert from './custom_alert';
import UltimatePagination from  './ultimate_pagination';

class TaskList extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            tasks: [],
            data: {"message" : ""},
            isVisible: false,
            page: 1,
            total_pages: 1,
            timer: 0,
            query: ''
        };

        this.onPageChange = this.onPageChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    updateTasksAsync() {
        $.getJSON("/plugins/problems_bank/api/bank_tasks").then((tasks) => {
            let new_total_pages;
            let new_tasks_length = tasks.length;
            if(Math.ceil(new_tasks_length / this.props.limit) === 0){
                new_total_pages = 1;
            }else{
                new_total_pages = Math.ceil(new_tasks_length / this.props.limit);
            }

            this.setState({
                total_pages: new_total_pages,
                page: 1,
                tasks
            });
        });
    }

    updateFilteredTasks(filtered_tasks){
        let new_total_pages = Math.ceil(filtered_tasks.length / this.props.limit);
        let new_page;
        if( new_total_pages >= 1) {
            if( this.state.page > new_total_pages){
                new_page = new_total_pages
            } else {
                new_page = this.state.page; // Current page remains
            }
        } else {
            new_page = 1;
            new_total_pages = 1;
        }

        this.setState({
            tasks : filtered_tasks,
            page : new_page,
            total_pages : new_total_pages
        });
    }

    componentDidMount() {
        this.updateTasksAsync()
    }

    onChildChanged(data){
        this.setState({
           isVisible: true,
           data
        });
    }

    onChildChangedClose(isVisible){
        this.setState({
           isVisible
        });
    }

    onPageChange(page) {
        this.setState({page});
    }

    handleChange(e) {
        let new_state_query = e.target.value; // The new value is required first

        if( new_state_query === ""  && (this.props.refreshTasks.length !== this.state.tasks.length) ){
            this.updateTasksAsync();
        } else {
            clearTimeout(this.state.timer);
            this.setState({
               query: new_state_query,
               timer: setTimeout(() => {
                   $.post( "/plugins/problems_bank/api/filter_bank_tasks",
                       { "task_query": this.state.query }, (filtered_tasks) => this.updateFilteredTasks(filtered_tasks));
               }, 250)
            });
        }

    };

    render() {

        let tasks = this.state.tasks.map((task, i) => {
            if(i >= ((this.state.page - 1) * this.props.limit) && i < (this.state.page * this.props.limit)){
                return (<Task task_info={task} key={i}
                              callbackParent={(data) => this.onChildChanged(data)}/>)
            }
        });

        return (
            <div>

                <form className="custom-search-input">
                  <FormControl
                    type="text"
                    value={this.state.value}
                    placeholder="Search a key word"
                    onChange={this.handleChange}
                  />
                </form>

                <div>The following tasks are available for copying: </div>

                <div className="list-group">{tasks}</div>

                <UltimatePagination
                     currentPage={this.state.page}
                     totalPages={this.state.total_pages}
                     onChange={this.onPageChange}
                />

                <CustomAlert message={this.state.data["message"]} isVisible={this.state.isVisible}
                             callbackParent={(isVisible) => this.onChildChangedClose(isVisible)}/>
            </div>
        );
    }
}

export default TaskList;