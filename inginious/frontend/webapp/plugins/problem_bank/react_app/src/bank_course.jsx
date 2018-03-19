import React from "react";
import $ from 'jquery';
import { Modal, Button, Alert } from 'react-bootstrap';

class BankCourse extends React.Component {

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

    deleteCourse = () => {
        let course_id = this.props.name;
        let updateParent = this.props.callbackParent;

        $.ajax({
            url: '/plugins/problems_bank/api/bank_courses?' + $.param({"course_id": course_id}),
            type: "DELETE",
            success: function(data){
                updateParent()
            }
        });

        this.close();
    };

    render() {
        return (
            <div>
                <button type="button" className="list-group-item">
                    <b>{this.props.name}</b>
                <a className="pull-right" onClick={this.open} >
                    <span className="glyphicon glyphicon-remove"></span>
                </a>
                </button>
                <Modal className="modal-container"
                    show={this.state.showModal}
                    onHide={this.close}
                    animation={true}
                    bsSize="large">

                    <Modal.Header closeButton>
                        <Modal.Title> {this.props.name} </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                      <Alert bsStyle="warning">
                          <h5><strong>Are you sure that you want to remove the bank privileges from this course?</strong></h5>
                          <h6>* The course won't be remove, only the permits to be a bank will be removed.</h6>
                      </Alert>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={this.close}>Cancel</Button>
                        <Button onClick={this.deleteCourse} bsStyle="primary">Remove</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}
export default BankCourse;