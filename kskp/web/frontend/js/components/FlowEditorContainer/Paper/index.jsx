//@flow
import * as React from 'react'
import Index from 'Shared/SVG/Shadow'
import Constants from 'Constants/index'
import style from './style.scss'
import { ZoomUtil } from 'Utils/index'
import type { GraphType } from "Types/index";

type PaperProps = {
  zoom : number;
  graph: GraphType;
  children: React.Node;
}

class Paper extends React.Component<PaperProps> {
  render () {

    const {zoom, graph} = this.props

    const paperWidth = graph.width + Constants.paper.padding.right
    const paperHeight = graph.height + Constants.paper.padding.bottom
    const viewWidth = ZoomUtil.zoomReverse(paperWidth, zoom)
    const viewHeight = ZoomUtil.zoomReverse(paperHeight, zoom)

    if (!paperWidth || !paperHeight) return null

    return <svg className={style.paper} width={paperWidth} height={paperHeight}
                viewBox={'0 0 ' + viewWidth + ' ' + viewHeight}>
      <Index />
      {this.props.children}
    </svg>
  }
}

export default Paper