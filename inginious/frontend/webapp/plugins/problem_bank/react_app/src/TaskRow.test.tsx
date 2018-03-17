import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

describe('TaskRow', () => {
    let wrapper: ShallowWrapper<{}, {}>

    beforeEach(() => {
        wrapper = shallow(<div/>);
    })

    it('Renders properly', () => {
        expect(wrapper).toMatchSnapshot();
    });
});

