// @flow
import * as React from 'react'
import Index from '../../shared/Shadow'
import Constants from '../../../constants/index'
import type { FlowEditorProps } from '../index'

class Paper extends React.Component<FlowEditorProps> {
  render () {
    return <svg className="kskp-paper" style={{width:this.props.graph.width + Constants.paper.padding.right,height:this.props.graph.height + Constants.paper.padding.bottom}}>
      <Index />
      {this.props.children}
    </svg>
  }
}

export default Paper