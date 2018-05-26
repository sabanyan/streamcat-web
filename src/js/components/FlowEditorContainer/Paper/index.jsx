// @flow
import * as React from 'react'
import Index from '../../shared/Shadow'
import Constants from '../../../constants/index'
import type { FlowEditorProps } from '../index'
import style from './style.scss'

class Paper extends React.Component<FlowEditorProps> {
  render () {
    const width = this.props.graph.width + Constants.paper.padding.right
    const height = this.props.graph.height + Constants.paper.padding.bottom;
    return <svg className={style.paper} width={width} height={height} viewBox={"0 0 " + width + " " + height}>
      <Index />
      {this.props.children}
    </svg>
  }
}

export default Paper