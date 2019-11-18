import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import EventEmitter from 'eventemitter3'
import store from 'Modules/store/index'
import { ViewId, Kskp } from './Kskp/index';

window.emitter = new EventEmitter()

let elementId = ''
let viewId:ViewId = ViewId.Undefined

if (document.getElementById('flow_editor')){
  elementId = 'flow_editor'
  viewId = ViewId.Flow_Editor
}

if (document.getElementById('project_list')) {
  elementId = 'project_list'
  viewId = ViewId.Project_List
}

if (document.getElementById('flow_list')) {
  elementId = 'flow_list'
  viewId = ViewId.Flow_List
}

if (document.getElementById('library_list')) {
  elementId = 'library_list'
  viewId = ViewId.Library_List
}

if (document.getElementById('profile')) {
  elementId = 'profile'
  viewId = ViewId.Profile
}

ReactDOM.render(
  <Provider store={store}>
    <Kskp viewId={viewId}/>
  </Provider>,
  document.getElementById(elementId),
)