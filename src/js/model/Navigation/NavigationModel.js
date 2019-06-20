//@flow
import React from 'react'
import ReactDOM from 'react-dom'
import NavigationBar from 'Shared/NavigationBar'
import Constants from 'Constants/index'
import Model from "Model/Core";

export type NavigationModelProps = {
  flow_name: string;
  flow_uuid: string;
  project_name: string;
  project_uuid: string;
  user_id: string;
  user_name: string;
}

export default class NavigationModel extends Model {
  flow_name: string
  flow_uuid: string
  project_name: string
  project_uuid: string
  user_id: string
  user_name: string

  constructor (props: NavigationModelProps) {
    super(props)
    this.initialize(props, 'flow_name')
    this.initialize(props, 'flow_uuid')
    this.initialize(props, 'project_name')
    this.initialize(props, 'project_uuid')
    this.initialize(props, 'user_id')
    this.initialize(props, 'user_name')
    this.renderNavigation()
    window.navigationModel = this
    window.emitter.emit(Constants.event.ON_LOAD_NAVIGATION, this)
  }

  renderNavigation () {
    if (document.getElementById('navigation')) {
      //すでにレンダリングされているので、一度アンマウントして再度レンダーし直す
      //ref:https://reactjs.org/blog/2015/10/01/react-render-and-top-level-api.html
      ReactDOM.unmountComponentAtNode(document.getElementById('navigation'))
      ReactDOM.render(
        <NavigationBar baseUrl={inject_static_url} navigation={this} />,
        document.getElementById('navigation'),
      )
    }
  }

}