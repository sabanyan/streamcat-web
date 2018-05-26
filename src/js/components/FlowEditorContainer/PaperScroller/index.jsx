// @flow
import * as React from 'react'
import type { FlowEditorProps } from '../index'

class PaperScroller extends React.Component<FlowEditorProps> {
  componentDidMount(){
  }

  onMouseDown(e:{_dispatchListeners:{length:number}}){
    if(e._dispatchListeners.length == 1){
      this.props.selectSteps()
    }
  }

  render () {
    return <div onMouseDown={(e)=>this.onMouseDown(e)} className="kskp-paper-scroller">
      {this.props.children}
    </div>
  }
}


export default PaperScroller