// @flow
import * as React from 'react'
import Index from '../../shared/Shadow'
import Constants from '../../../constants/index'

type Props ={
  graph:{width:number,height:number},
  children: React.Node
}

class Paper extends React.Component<Props> {
  render () {
    return <svg className="kskp-paper" style={{width:this.props.graph.width + Constants.paper.padding.right,height:this.props.graph.height + Constants.paper.padding.bottom}}>
      <Index />
      {this.props.children}
    </svg>
  }
}

export default Paper