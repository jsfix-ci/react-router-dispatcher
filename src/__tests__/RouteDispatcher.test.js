import React from 'react';
import { shallow, mount } from './enzyme';
import { RouteDispatcher } from '../RouteDispatcher';
import { MemoryRouter } from 'react-router'

describe('RouteDispatcher', () => {
    const location = { pathname: '/' };
    const defaultRoutes = [];
    let dispatchActions;

    beforeEach(() => {
       dispatchActions = RouteDispatcher.dispatch;
       RouteDispatcher.dispatch = jest.fn(() => Promise.resolve());
    });

    afterEach(() => {
        RouteDispatcher.dispatch = dispatchActions;
    });

    describe('constructor', () => {
        test('standardizes dispatchActions prop', () => {
            let dispatcher = new RouteDispatcher({ dispatchActions: 'loadData' });
            expect(dispatcher.state.dispatchActions).toEqual([['loadData']]);

            dispatcher = new RouteDispatcher({ dispatchActions: ['loadData'] });
            expect(dispatcher.state.dispatchActions).toEqual([['loadData']]);

            dispatcher = new RouteDispatcher({ dispatchActions: ['loadData', 'parseData'] });
            expect(dispatcher.state.dispatchActions).toEqual([['loadData', 'parseData']]);

            dispatcher = new RouteDispatcher({ dispatchActions: [['loadData']] });
            expect(dispatcher.state.dispatchActions).toEqual([['loadData']]);

            dispatcher = new RouteDispatcher({ dispatchActions: [['loadData'], ['parseData']] });
            expect(dispatcher.state.dispatchActions).toEqual([['loadData'], ['parseData']]);

            dispatcher = new RouteDispatcher({ dispatchActions: () => [['loadData']] });
            expect(typeof dispatcher.state.dispatchActions).toBe('function');
        });

        test('assigns state', () => {
            const dispatchActionsOnFirstRender = false;
            const dispatcher = new RouteDispatcher({ dispatchActionsOnFirstRender, dispatchActions: [['loadData']] });

            expect(dispatcher.state.previousLocation).toBe(null);
            expect(dispatcher.state.hasDispatchedActions).toBe(!dispatchActionsOnFirstRender);
        });

        test('dispatches actions if not previously done', done => {
            const wrapper = shallow(<RouteDispatcher location={location} routes={defaultRoutes} dispatchActionsOnFirstRender={true} dispatchActions={() => [['loadData']]} />);

            setImmediate(() => {
                expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(1);
                expect(wrapper.state('hasDispatchedActions')).toBe(true);
                done();
            });
        });
    });

    describe('componentWillMount', () => {
        test('does not dispatch actions if previously dispatched', () => {
            shallow(<RouteDispatcher routes={defaultRoutes} dispatchActionsOnFirstRender={false} />);
            expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(0);
        });

        test('dispatches actions if not previously done', done => {
            const wrapper = shallow(<RouteDispatcher location={location} routes={defaultRoutes} dispatchActionsOnFirstRender={true} />);

            setImmediate(() => {
                expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(1);
                expect(wrapper.state('hasDispatchedActions')).toBe(true);
                done();
            });
        });
    });

    describe('componentWillReceiveProps', () => {
        test('does not dispatch actions when location has not changed', () => {
            const currentLocation = {};
            const wrapper = shallow(<RouteDispatcher  routes={defaultRoutes} dispatchActionsOnFirstRender={false} location={currentLocation} />);
            wrapper.instance().componentWillReceiveProps({ location: currentLocation });

            expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(0);
            expect(wrapper.state('previousLocation')).toBe(null);
        });

        test('does not dispatch actions when dispatchActions has not changed', () => {
            const wrapper = shallow(<RouteDispatcher routes={defaultRoutes} dispatchActionsOnFirstRender={false} dispatchActions={[['loadData']]} />);
            wrapper.instance().componentWillReceiveProps({ dispatchActions: [['loadData']] });

            expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(0);
            expect(wrapper.state('previousLocation')).toBe(null);
        });

        test('does not dispatch actions when dispatchActions function has not changed', () => {
            const dispActionFunc = () => {};
            const wrapper = shallow(<RouteDispatcher routes={defaultRoutes} dispatchActionsOnFirstRender={false} dispatchActions={dispActionFunc} />);
            wrapper.instance().componentWillReceiveProps({ dispatchActions: dispActionFunc });

            expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(0);
            expect(wrapper.state('previousLocation')).toBe(null);
        });

        test('dispatches actions when location has changed', done => {
            const newLocation = { pathname: '/root' };
            const wrapper = shallow(
                <RouteDispatcher
                    location={location}
                    routes={defaultRoutes}
                    dispatchActionsOnFirstRender={false} />);

            wrapper.instance().componentWillReceiveProps({ location: newLocation });

            expect(wrapper.state('previousLocation')).toEqual(location);
            setImmediate(() => {
                expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(1);
                expect(wrapper.state('previousLocation')).toEqual(null);
                done();
            });
        });

        test('dispatches actions when dispatchActions has changed', done => {
            const wrapper = shallow(
                <RouteDispatcher
                    location={location}
                    routes={defaultRoutes}
                    dispatchActionsOnFirstRender={false}
                    dispatchActions={[['loadData']]} />);

            wrapper.instance().componentWillReceiveProps({ dispatchActions: [['loadData', 'getMetadata']] });

            expect(wrapper.state('previousLocation')).toEqual(location);
            setImmediate(() => {
                expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(1);
                expect(wrapper.state('previousLocation')).toEqual(null);
                done();
            });
        });

        test('dispatches actions when dispatchActions function has changed', done => {
            const dispActionFunc1 = () => {};
            const dispActionFunc2 = () => {};

            const wrapper = shallow(
                <RouteDispatcher
                    location={location}
                    routes={defaultRoutes}
                    dispatchActionsOnFirstRender={false}
                    dispatchActions={dispActionFunc1} />);

            wrapper.instance().componentWillReceiveProps({ dispatchActions: dispActionFunc2 });

            expect(wrapper.state('previousLocation')).toEqual(location);
            setImmediate(() => {
                expect(RouteDispatcher.dispatch.mock.calls).toHaveLength(1);
                expect(wrapper.state('previousLocation')).toEqual(null);
                done();
            });
        });
    });

    describe('render', () => {
        test('displays default loading component before actions have been dispatched', () => {
            const wrapper = shallow(<RouteDispatcher location={location} routes={defaultRoutes} dispatchActionsOnFirstRender={true} />);
            expect(wrapper.html()).toBe('<div>Loading...</div>');
        });

        test('displays loading component before actions have been dispatched', () => {
            class Indicator extends React.Component {
                render() {
                    return <div>component</div>;
                }
            }

            const wrapper = shallow(<RouteDispatcher loadingIndicator={Indicator} location={location} routes={defaultRoutes} dispatchActionsOnFirstRender={true} />);
            expect(wrapper.html()).toBe('<div>component</div>');
        });

        test('displays loading stateless component before actions have been dispatched', () => {
            const wrapper = shallow(<RouteDispatcher loadingIndicator={() => <div>stateless</div>} location={location} routes={defaultRoutes} dispatchActionsOnFirstRender={true} />);
            expect(wrapper.html()).toBe('<div>stateless</div>');
        });

        test('displays loading markup before actions have been dispatched', () => {
            const wrapper = shallow(<RouteDispatcher loadingIndicator="markup" location={location} routes={defaultRoutes} dispatchActionsOnFirstRender={true} />);
            expect(wrapper.html()).toBe('<div>markup</div>');
        });

        test('renders routes', () => {
            const mockRender = jest.fn(() => null);
            const routes = [];
            mount(
                <MemoryRouter>
                    <RouteDispatcher dispatchActionsOnFirstRender={false} render={mockRender} routes={routes} renderProp={'1'} />
                </MemoryRouter>
            );

            expect(mockRender.mock.calls).toHaveLength(1);
            expect(mockRender.mock.calls[0][0]).toEqual(routes);
            expect(mockRender.mock.calls[0][1]).toEqual({ renderProp: '1' });
        });

        test('returns null if no routes exist', () => {
            const wrapper = mount(
                <MemoryRouter>
                    <RouteDispatcher routes={defaultRoutes} dispatchActionsOnFirstRender={false} />
                </MemoryRouter>
            );
            expect(wrapper.html()).toBe(null);
        });
    });
});
