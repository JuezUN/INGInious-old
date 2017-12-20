import React from 'react';
import ReactDOM from 'react-dom';
import Autosuggest from 'react-autosuggest';
import { Tabs, Tab, Modal, Button, Row, Col, Well, Alert, FormControl } from 'react-bootstrap';
import {createUltimatePagination, ITEM_TYPES} from 'react-ultimate-pagination';
import './index.css';

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

const WrapperComponent = ({children}) => (
  <ul className="pagination custom-pagination" >{children}</ul>
);

const Page = ({value, isActive, onClick}) => (
  <li className={isActive ? 'active' : null}><a href="#" onClick={onClick}>{value}</a></li>
);

const Ellipsis = ({onClick}) => (
  <li><a href="#" onClick={onClick}>...</a></li>
);

const FirstPageLink = ({isActive, onClick}) => (
  <li><a href="#" onClick={onClick}>&laquo;</a></li>
);

const PreviousPageLink = ({isActive, onClick}) => (
  <li><a href="#" onClick={onClick}>&lsaquo;</a></li>
);

const NextPageLink = ({isActive, onClick}) => (
  <li><a href="#" onClick={onClick}>&rsaquo;</a></li>
);

const LastPageLink = ({isActive, onClick}) => (
  <li><a href="#" onClick={onClick}>&raquo;</a></li>
);

const itemTypeToComponent = {
  [ITEM_TYPES.PAGE]: Page,
  [ITEM_TYPES.ELLIPSIS]: Ellipsis,
  [ITEM_TYPES.FIRST_PAGE_LINK]: FirstPageLink,
  [ITEM_TYPES.PREVIOUS_PAGE_LINK]: PreviousPageLink,
  [ITEM_TYPES.NEXT_PAGE_LINK]: NextPageLink,
  [ITEM_TYPES.LAST_PAGE_LINK]: LastPageLink
};

const UltimatePagination = createUltimatePagination({itemTypeToComponent, WrapperComponent});

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
            this.setState({
                tasks
            });
            if(Math.ceil(this.state.tasks.length / this.props.limit) === 0){
                this.setState({
                    total_pages: 1,
                    page: 1
                });
            }else{
                this.setState({
                    total_pages: Math.ceil(this.state.tasks.length / this.props.limit),
                    page: 1
                });
            }
        });
    }

    componentDidMount() {
        this.updateTasksAsync()
    }

    onChildChanged(data){
        this.setState({
           data
        });
        this.setState({
           isVisible: true
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

        let update = this;

        update.setState({
            timer : clearTimeout(update.state.timer),
            query : e.target.value
        });

        update.setState({
           timer :  setTimeout(function() {
                        $.post( "/plugins/problems_bank/api/filter_bank_tasks", { "task_query": update.state.query }, function( filtered_tasks ) {
                            update.setState({
                                tasks : filtered_tasks
                            });

                            let new_total_pages = Math.ceil(update.state.tasks.length / update.props.limit);

                            if( new_total_pages >= 1) {
                                if( update.state.page > new_total_pages){
                                    update.setState({
                                        page: new_total_pages,
                                        total_pages: new_total_pages
                                    });
                                }else{
                                    update.setState({
                                        total_pages: new_total_pages
                                    });
                                }
                            }else{
                                update.setState({
                                    page :1,
                                    total_pages: 1
                                });
                            }
                        });
                    }, 250)
        });

    };

    render() {

        if( this.state.query === ""  && (this.props.refreshTasks.length !== this.state.tasks.length) ){
            this.updateTasksAsync();
        }

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
 
class Task extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            showModal: false
        };
    }


    open = () => {
        this.setState({ showModal: true });
    };

    close = () => {
        this.setState({ showModal: false });
    };

    onChildChanged(data){
        let updateParent = this.props.callbackParent;
        updateParent(data);
        this.close();
    }

    render() {
        return (
            <div>
                <button type="button" className="list-group-item" onClick={this.open}>
                    <b>{this.props.task_info.course_id + " - " + this.props.task_info.task_name}</b>
                    <br/>
                    { ["simulation", " graph theory", " longest path", " sorting"].toString() }
                </button>
                <Modal className="modal-container"
                    show={this.state.showModal}
                    onHide={this.close}
                    animation={true}
                    bsSize="large">

                    <Modal.Header closeButton>
                        <Modal.Title> {this.props.task_info.task_name} </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        <Row>
                          <Col md={1}>
                            <h5>Author</h5>
                          </Col>
                          <Col md={11}>
                              <Well bsSize="small">{this.props.task_info.task_author}</Well>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={1}>
                            <h5>Context</h5>
                          </Col>
                          <Col md={11}>
                              <Well bsSize="small">{this.props.task_info.task_context}</Well>
                          </Col>
                        </Row>

                        <Well bsSize="small">
                            <h5>Select destination course</h5>
                            <GeneralCourseAutosuggest task_info={this.props.task_info}
                                                      callbackParent={(data) => this.onChildChanged(data)}/>
                        </Well>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={this.close}>Close</Button>
                        {/* <Button bsStyle="primary">Save changes</Button> */}
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}


class CustomAlert extends React.Component {

    handleAlertDismiss = () => {
        this.props.isVisible = false;

        let updateParent = this.props.callbackParent;
        updateParent(this.props.isVisible);

        this.forceUpdate();
    };

    render() {
        if (this.props.isVisible) {
          return (
            <Alert bsStyle="success" onDismiss={this.handleAlertDismiss}>
              <h4>Success!</h4>
              <p>{this.props.message}</p>
            </Alert>
          );
        }else{
            return (
                <p>
                </p>
            );
        }
    }
}

class BankCourse extends React.Component {

    deleteCourse = () => {
        let course_id = this.props.name;
        let updateParent = this.props.callbackParent;

        $.ajax({
            url: '/plugins/problems_bank/api/bank_courses?' + $.param({"course_id": course_id}),
            type: "DELETE",
            success: function(data){
                updateParent()
            }
        })
    };

    render() {
        return (
            <div>
                <button type="button" className="list-group-item">
                    <b>{this.props.name}</b>
                <a className="pull-right" onClick={this.deleteCourse} >
                    <span className="glyphicon glyphicon-remove"></span>
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

ReactDOM.render(
    (<BankPage/>),
    document.getElementById('reactRoot')
);