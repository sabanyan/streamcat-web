// @flow
import * as React from 'react'
import type { FlowEditorProps } from '../index'
import style from './style.scss'

class PaperScroller extends React.Component<FlowEditorProps> {
  componentDidMount(){
  }

  onMouseDown(e:{_dispatchListeners:{length:number},pageX:number,pageY:number}){
    //e._dispatchListeners.length は step がクリックされた場合は 2　それ以外は 1
    if(e._dispatchListeners.length == 1){
      this.props.selectSteps()
      this.props.dragStart(e.pageX,e.pageY )
    }
  }

  onMouseMove(e:MouseEvent){
    if(this.props.drag.start) {
      this.props.dragging(e.pageX, e.pageY)
    }
  }

  onMouseUp(e:MouseEvent){
    if(this.props.drag.start){
      this.props.dragEnd(e.pageX,e.pageY)
    }
  }

  render () {
    return <div onMouseDown={(e)=>this.onMouseDown(e)} onMouseMove={(e)=>this.onMouseMove(e)} onMouseUp={(e)=>this.onMouseUp(e)} className={style.paper_scroller}>
      {this.props.children}
    </div>
  }
}


export default PaperScroller