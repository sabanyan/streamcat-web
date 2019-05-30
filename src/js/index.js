//@flow
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import flowEditorReducer from './modules/application'
import libraryReducer from './modules/library'
import flowListReducer from './modules/flowList'
import thunk from 'redux-thunk'
import { reducer as notificationsReducer } from 'reapop'
import FlowEditorContainer from './components/FlowEditorContainer'
import EventEmitter from 'eventemitter3'
import ProjectListContainer from './components/ProjectListContainer'
import FlowListContainer from './components/FlowListContainer'
import LibraryListContainer from './components/LibraryListContainer'
import NavigationBar from './components/shared/NavigationBar'
import ProfileContainer from './components/ProfileContainer'

window.emitter = new EventEmitter()

//let appStore = createStore(reducer, window.__REDUX_DEVTOOLS_EXTENSION__ &&
//  window.__REDUX_DEVTOOLS_EXTENSION__())

// default value for notifications
const defaultNotification = {
  position: 'tr',
  dismissible: true,
  dismissAfter: 2000,
  allowHTML: true,
  closeButton: false
};

// store
const createStoreWithMiddleware = compose(
  applyMiddleware(thunk)
)(createStore);

const store = createStoreWithMiddleware(combineReducers({
  notifications: notificationsReducer(defaultNotification),
  flowEditorReducer,
  libraryReducer,
  flowListReducer
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

if (document.getElementById('flow_editor')) {
  ReactDOM.render(
    <Provider store={store}>
      <FlowEditorContainer/>
    </Provider>,
    document.getElementById('flow_editor'),
  )
}

if (document.getElementById('project_list')) {
  ReactDOM.render(
    <ProjectListContainer/>,
    document.getElementById('project_list'),
  )
}
if (document.getElementById('flow_list')) {
  ReactDOM.render(
    <Provider store={store}>
      <FlowListContainer/>
    </Provider>,
    document.getElementById('flow_list'),
  )
}

if (document.getElementById('library_list')) {
  ReactDOM.render(
    <Provider store={store}>
      <LibraryListContainer/>
    </Provider>,
    document.getElementById('library_list'),
  )
}
if (document.getElementById('profile')) {
  ReactDOM.render(
    <ProfileContainer navigation={this}/>,
    document.getElementById('profile'),
  )
}
if (document.getElementById('navigation')) {
  ReactDOM.render(
    <NavigationBar baseUrl={inject_static_url} navigation={this}/>,
    document.getElementById('navigation'),
  )
}