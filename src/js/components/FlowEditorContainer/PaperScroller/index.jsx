//@flow
import * as React from 'react'
import type { FlowEditorProps } from '../index'
import style from './style.scss'
import DetectUtil from '../../../utils/DetectUtil'
import Graph from '../../../utils/Graph'
import SubFlowStepModel from '../../../model/Step/SubFlowStepModel'
import CommandStepModel from '../../../model/Step/CommandStepModel'

class PaperScroller extends React.Component<FlowEditorProps, State> {
  componentDidMount () {
  }

  // cutSteps(){
  //   const {selected_step_ids} = this.props
  //   const cutData = this.getCopyNodes()
  //   navigator.clipboard.writeText(cutData).then(()=> {
  //     this.props.cutSteps(selected_step_ids)
  //   }, (err)=> {
  //     alert("クリップボードが利用できません")
  //
  //   });
  // }
  //
  pasteSteps(){
     navigator.clipboard.readText().then((data)=>{
       this.props.pasteSteps(data)
     }, (err)=> {
       alert("クリップボードが利用できません")
     });
  }

   getCopyNodes():string{
     const {selected_step_ids,nodes} = this.props
     return JSON.stringify(selected_step_ids.map((id)=>{
       return Graph.getNode(nodes,id)
     }))
   }

  /**
   * コピー可能なステップの判断（コマンド or サブフロー を1つのみ）
   * @returns {boolean}
   */
   copyableStep(){
     const {selected_step_ids} = this.props

     if(selected_step_ids.length !== 1)return false

     const targetNode =  Graph.getNode(nodes,selected_step_ids[0])

     if (targetNode instanceof SubFlowStepModel || targetNode instanceof CommandStepModel) {
       return true
     }
    return false
  }

   copySteps(){
     if(!this.copyableStep()){
       navigator.clipboard.writeText("")
       return
     }

     const {selected_step_ids} = this.props
     const copyData = this.getCopyNodes()
     navigator.clipboard.writeText(copyData).then(()=> {
       this.props.copySteps(selected_step_ids)
     }, (err)=> {
       alert("クリップボードが利用できません")
     });
   }

  deleteSteps(){
    const {selected_step_ids} = this.props
    this.props.deleteSteps(selected_step_ids)
  }

  onKeyDown (e: KeyboardEvent) {
    if (DetectUtil.isMac()) {
      // if (e.metaKey && e.key === 'x') {
      //   this.cutSteps()
      //   return
      // }
       if (e.metaKey && e.key === 'c') {
         this.copySteps()
         return
       }
       if (e.metaKey && e.key === 'v') {
         this.pasteSteps()
         return
       }
      if (e.metaKey && e.key === 'z') {
        this.props.undo()
        return
      }
      if (e.metaKey && e.key === 'y') {
        this.props.redo()
        return
      }
    }
    else {
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.deleteSteps()
    }
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