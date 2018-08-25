//@flow
import * as React from 'react'
import type { FlowEditorProps } from '../index'
import style from './style.scss'
import DetectUtil from '../../../utils/DetectUtil'

class PaperScroller extends React.Component<FlowEditorProps, State> {
  componentDidMount () {
  }

  onKeyDown (e: KeyboardEvent) {
    if (DetectUtil.isMac()) {
      const {selected_step_ids} = this.props

      console.log(selected_step_ids)

      if (e.metaKey && e.key === 'x') {
        this.props.cutSteps(selected_step_ids)
        return
      }
      if (e.metaKey && e.key === 'c') {
        this.props.copySteps(selected_step_ids)
        return
      }
      if (e.metaKey && e.key === 'v') {
        this.props.pasteSteps(selected_step_ids)
        return
      }
      if (e.key === 'Backspace') {
        this.props.deleteSteps(selected_step_ids)
        return
      }
    }
    else {
      console.log(e.ctrlKey)
      console.log(e.key)
    }
  }

  onCut (selected_step_ids: []) {

  }

  onPast (selected_step_ids: []) {

  }

  onCopy (selected_step_ids: []) {

  }

  onMouseDown (e: { _dispatchListeners: { length: number }, pageX: number, pageY: number, shiftKey: boolean }) {
    if (this.isOnClickPaper(e) && !e.shiftKey) {
      this.props.selectSteps()
      this.props.dragStart(e.pageX, e.pageY)
      this.setState({
        coords: {
          x: e.pageX,
          y: e.pageY,
        },
      })
    }
  }

  onMouseMove (e: MouseEvent) {
    if (this.props.drag.start) {
      this.props.dragging(e.pageX, e.pageY)
    }
  }

  onMouseUp (e: MouseEvent) {
    if (this.isOnClickPaper(e)) {
      if (this.props.drag.end) {
        this.props.dragEnd(e.pageX, e.pageY)
      }
    }
  }

  isOnClickPaper (e: { _dispatchListeners: { length: number } }) {
    //e._dispatchListeners.length は step がクリックされた場合は 2　それ以外は 1
    return (e._dispatchListeners.length == 1)
  }

  render () {
    // onKeyDownには tabIndex が必要
    // ref:https://stackoverflow.com/questions/43503964/onkeydown-event-not-working-on-divs-in-react
    return <div tabIndex={0} onKeyDown={(e) => this.onKeyDown(e)}
                onMouseDown={(e) => this.onMouseDown(e)}
                onMouseMove={(e) => this.onMouseMove(e)}
                onMouseUp={(e) => this.onMouseUp(e)}
                className={style.paper_scroller}>
      {this.props.children}
    </div>
  }
}

export default PaperScroller