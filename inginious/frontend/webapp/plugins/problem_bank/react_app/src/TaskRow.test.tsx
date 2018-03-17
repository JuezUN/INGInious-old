import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import TaskRow from './TaskRow';
import Task from './Task';


describe('TaskRow', () => {
  const someTask: Task = {
    id: 'someId',
    name: 'language tasks!',
    author: 'andres rondon',
    context: 'n/a',
    tags: ['cpp', 'datastructures'],
  };

  let wrapper: ShallowWrapper<{}, {}>;

  beforeEach(() => {
    wrapper = shallow(<TaskRow task={someTask}/>);
  });

  it('renders properly', () => {
    expect(wrapper).toMatchSnapshot();
  });
});

