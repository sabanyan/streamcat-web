//@flow
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import reducer from './modules/application'
import FlowEditorContainer from './components/FlowEditorContainer'
import EventEmitter from 'eventemitter3'
import ProjectListContainer from './components/ProjectListContainer'
import FlowListContainer from './components/FlowListContainer'
import LibraryListContainer from './components/LibraryListContainer'
import NavigationBar from './components/shared/NavigationBar'

window.emitter = new EventEmitter()

const store = createStore(reducer, window.__REDUX_DEVTOOLS_EXTENSION__ &&
  window.__REDUX_DEVTOOLS_EXTENSION__())

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
    <FlowListContainer/>,
    document.getElementById('flow_list'),
  )
}

if (document.getElementById('library_list')) {
  ReactDOM.render(
    <LibraryListContainer/>,
    document.getElementById('library_list'),
  )
}

if (document.getElementById('navigation')) {
  ReactDOM.render(
    <NavigationBar baseUrl={inject_static_url} navigation={this}/>,
    document.getElementById('navigation'),
  )
}