import React from "react";
import { Modal, Button, Row, Col, Well } from 'react-bootstrap';
import GeneralCourseAutosuggest from './general_course_autosuggest';

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
                    {this.props.task_info.tags.join(', ')}
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
export default Task;