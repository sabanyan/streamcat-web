import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import { createStore } from 'redux'
import reducer from './modules/application'
import FlowEditorContainer from './components/FlowEditorContainer'
import VisualizationContainer from './components/VisualizationContainer'
import EventEmitter from 'eventemitter3'
import ProjectListContainer from './components/ProjectListContainer'
import FlowListContainer from './components/FlowListContainer'

window.emitter = new EventEmitter()

const store = createStore(reducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

if(document.getElementById('flow_editor')){
  ReactDOM.render(
    <Provider store={store}>
      <FlowEditorContainer />
    </Provider>,
    document.getElementById('flow_editor')
  )
}

if(document.getElementById('visualization')){
  ReactDOM.render(
    <Provider store={store}>
      <VisualizationContainer />
    </Provider>,
    document.getElementById('visualization')
  )
}

if(document.getElementById('project_list')){
  ReactDOM.render(
      <ProjectListContainer />,
    document.getElementById('project_list')
  )
}
if(document.getElementById('flow_list')){
  ReactDOM.render(
    <FlowListContainer />,
    document.getElementById('flow_list')
  )
}
