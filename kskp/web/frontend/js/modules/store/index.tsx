import { applyMiddleware, combineReducers, createStore } from 'redux'
import thunk from 'redux-thunk'
import { FlowEditorReducer } from 'Modules/index'
import { reducer as notificationsReducer } from 'reapop'
import { composeWithDevTools } from 'redux-devtools-extension';
import { CommonReducer } from 'Modules/reducers/index'
import {FlowEditorReducerInitialState} from "Modules/application";
import {CommonReducerInitialState} from "Modules/reducers/common";


// default value for notifications
export const defaultNotification = {
    position: 'tr',
    dismissible: true,
    dismissAfter: 2000,
    allowHTML: true,
    closeButton: false
};

export const rootReducerInitialState = {
    notifications: [],
    FlowEditorReducer: FlowEditorReducerInitialState,
    CommonReducer: CommonReducerInitialState
}

const rootReducer = combineReducers({
    notifications: notificationsReducer(defaultNotification),
    FlowEditorReducer,
    CommonReducer
});

export {rootReducer}

const enhancers = composeWithDevTools(
    applyMiddleware(thunk),
    // other store enhancers if any
)

const store = createStore(rootReducer, enhancers)

export default store
