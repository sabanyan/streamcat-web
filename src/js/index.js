import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import { createStore } from 'redux'
import reducer from './reducers/FlowReducer'
import FlowEditorContainer from './containers/FlowEditorContainer'
import VisualizationContainer from './containers/VisualizationContainer'
import EventEmitter from 'eventemitter3'

window.emitter = new EventEmitter()

const store = createStore(reducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

if(document.getElementById('floweditor')){
  ReactDOM.render(
    <Provider store={store}>
      <FlowEditorContainer />
    </Provider>,
    document.getElementById('floweditor')
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
