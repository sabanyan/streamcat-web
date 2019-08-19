//@flow
import * as React from 'react'
import style from './style.scss'
import { GraphUtil, DetectUtil } from 'Utils/index'
import { CommandStepModel, SubFlowStepModel } from 'Model/index'
import type { DragType, HistoryType } from "Types/index";

type PaperScrollerProps = {
  pasteSteps: Function;
  copySteps: Function;
  deleteSteps: Function;
  selectSteps: Function;
  dragStart: Function;
  dragging: Function;
  dragEnd: Function;
  addHistory: Function;
  redo: Function;
  undo: Function;
  selected_step_ids:[];
  nodes:[];
  history: HistoryType;
  drag: DragType;
  children: React.Node;
}

class PaperScroller extends React.Component<PaperScrollerProps> {
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
  pasteSteps () {
    navigator.clipboard.readText().then((data) => {
      this.props.pasteSteps(data)
    }, (err) => {
      alert('クリップボードが利用できません')
    })
  }

  getCopyNodes (): string {
    const {selected_step_ids, nodes} = this.props
    return JSON.stringify(selected_step_ids.map((id) => {
      return GraphUtil.getNode(nodes, id)
    }))
  }

  /**
   * コピー可能なステップの判断（コマンド or サブフロー を1つのみ）
   * @returns {boolean}
   */
  copyableStep () {
    const {selected_step_ids} = this.props

    if (selected_step_ids.length !== 1) return false

    const targetNode = GraphUtil.getNode(nodes, selected_step_ids[0])

    if (targetNode instanceof SubFlowStepModel || targetNode instanceof CommandStepModel) {
      return true
    }
    return false
  }

  copySteps () {
    if (!this.copyableStep()) {
      navigator.clipboard.writeText('')
      return
    }

    const {selected_step_ids} = this.props
    const copyData = this.getCopyNodes()
    navigator.clipboard.writeText(copyData).then(() => {
      this.props.copySteps(selected_step_ids)
    }, (err) => {
      alert('クリップボードが利用できません')
    })
  }

  deleteSteps () {
    const {selected_step_ids} = this.props
    this.props.deleteSteps(selected_step_ids)
  }

  onKeyDown (e: KeyboardEvent) {
    const current = this.props.history.current
    const max = this.props.history.nodes.length

    const redoDisabled = !(current + 1 < max)
    const undoDisabled = !(current - 1 >= 0)

    if (DetectUtil.isMac()) {
      if (e.metaKey && e.key === 'c') {
        this.copySteps()
        return
      }
      if (e.metaKey && e.key === 'v') {
        this.pasteSteps()
        return
      }
      if (e.metaKey && e.shiftKey && e.key === 'z') {
        if (!redoDisabled) this.props.redo()
        return
      }
      if (e.metaKey && e.key === 'z') {
        if (!undoDisabled) this.props.undo()
        return
      }
    } else {
      if (e.ctrlKey && e.key === 'c') {
        this.copySteps()
        return
      }
      if (e.ctrlKey && e.key === 'v') {
        this.pasteSteps()
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        if (!redoDisabled) this.props.redo()
        return
      }
      if (e.ctrlKey && e.key === 'z') {
        if (!undoDisabled) this.props.undo()
        return
      }
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.deleteSteps()
    }
  }

  onMouseDown (e: { _dispatchListeners: { length: number }, pageX: number, pageY: number, shiftKey: boolean }) {
    if (this.isOnClickPaper(e) && !e.shiftKey) {
      // 規定の要素からのカーソル座標値を求めるためには
      // https://qiita.com/yukiB/items/cc533fbbf3bb8372a924
      const target_rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - target_rect.left;
      const y = e.clientY - target_rect.top;

      this.props.selectSteps()
      this.props.dragStart(x, y)
      this.setState({
        coords: {
          x: x,
          y: y,
        },
      })
    }
  }

  onMouseMove (e: MouseEvent) {
    if (this.props.drag.start) {
      const target_rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - target_rect.left;
      const y = e.clientY - target_rect.top;

      this.props.dragging(x, y)
    }
  }

  onMouseUp (e: MouseEvent) {
    if (this.isOnClickPaper(e)) {
      if (this.props.drag.end) {
        const target_rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - target_rect.left;
        const y = e.clientY - target_rect.top;

        this.props.dragEnd(x, y)
      }
      this.props.addHistory()
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