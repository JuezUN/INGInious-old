import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

/*global $:false*/

class BankCourse extends React.Component {
    render() {
        return (
            <button type="button" className="list-group-item">{this.props.name}</button>
        );
    }
}

class Bank extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            courses: []
        };
    }

    componentDidMount() {
        $.getJSON("/api/bank_courses").then((courses) => {
            this.setState({
                courses
            });
        });
    }

    render() {
        let courses = this.state.courses.map((course, i) => {
            return (<BankCourse name={course} key={i} />)
        });

        return (
            <div className="list-group">{courses}</div>
        );
    }
}

ReactDOM.render(
    (<Bank/>),
    document.getElementById('reactRoot')
);