import React from 'react'
import ReactDOM from 'react-dom'
import NavigationBar from '../../components/shared/NavigationBar'

export type NavigationModelProps = {
  flow_name: string;
  flow_uuid: string;
  project_name: string;
  project_uuid: string;
  user_id: string;
  user_name: string;
}

export default class NavigationModel {
  flow_name: string
  flow_uuid: string
  project_name: string
  project_uuid: string
  user_id: string
  user_name: string

  constructor (props: NavigationModelProps) {
    this.flow_name = props.flow_name
    this.flow_uuid = props.flow_uuid
    this.project_name = props.project_name
    this.project_uuid = props.project_uuid
    this.user_id = props.user_id
    this.user_name = props.user_name
    this.renderNavigation()
    window.navigationModel = this
  }
  renderNavigation(){
    if (document.getElementById('navigation')) {
      //すでにレンダリングされているので、一度アンマウントして再度レンダーし直す
      //ref:https://reactjs.org/blog/2015/10/01/react-render-and-top-level-api.html
      ReactDOM.unmountComponentAtNode(document.getElementById('navigation'))
      ReactDOM.render(
        <NavigationBar baseUrl={inject_static_url} navigation={this}/>,
        document.getElementById('navigation'),
      )
    }
  }

}