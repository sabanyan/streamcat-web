//@flow
import React from 'react'
import ReactDOM from 'react-dom'
import { NavigationBar } from 'Shared/Base'
import Constants from 'Constants/index'
import Model from "Model/Core";

export type NavigationModelProps = {
  flow_name: string;
  flow_uuid: string;
  project_name: string;
  project_uuid: string;
  user_id: string;
  user_name: string;
  showCommandPalette: Boolean;
}

export default class NavigationModel extends Model {
  flow_name: string
  flow_uuid: string
  project_name: string
  project_uuid: string
  user_id: string
  user_name: string
  showCommandPalette: Boolean

  constructor (props: NavigationModelProps) {
    super(props)
    this.initialize(props, 'flow_name')
    this.initialize(props, 'flow_uuid')
    this.initialize(props, 'project_name')
    this.initialize(props, 'project_uuid')
    this.initialize(props, 'user_id')
    this.initialize(props, 'user_name')
    
    this.initialize(props, 'showCommandPalette')
    
    this.renderNavigation()
    window.navigationModel = this
    window.emitter.emit(Constants.event.ON_LOAD_NAVIGATION, this)
  }

  renderNavigation () {
    if (document.getElementById('navigation')) {
      //すでにレンダリングされているので、一度アンマウントして再度レンダーし直す
      //ref:https://reactjs.org/blog/2015/10/01/react-render-and-top-level-api.html
      ReactDOM.unmountComponentAtNode(document.getElementById('navigation'))

      const style = {
        width: '100%', 
        height: 64, 
        backgroundColor: 'rgb(178, 168, 193)',
        paddingLeft: '12px', paddingTop: '12px'
      }
      const styleCommandLine = {
        width: '948px', borderWidth: 0, borderRadius: '2px', 
        paddingTop: 6, paddingBottom: 6, paddingLeft: 6,
        fontFamily: 'courier, monospace', fontSize: '1.2em', color: '#333'
      }
      const styleButton = {
        height: 40, 
        width: '48px', 
        marginLeft: '16px', 
        borderWidth: 0, 
        borderRadius: '2px', 
        color: '#333'
      }
      
      let commandLine = undefined
      if (this.showCommandPalette) {
        commandLine = (
          <div style={style}>
            <input type="text" style={styleCommandLine}></input>            
            <button style={styleButton}>Run</button>
          </div>
        )
      }

      ReactDOM.render(
        <div>
          <NavigationBar baseUrl={inject_static_url} navigation={this} />
          {commandLine}
        </div>
        ,
        document.getElementById('navigation'),
      )
    }
  }

}