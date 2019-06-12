//@flow
import React from 'react'
import Constants from 'Constants/index'
import FileIcon from 'Shared/Icon/FileIcon'
import CommandStepModel from 'Model/Step/CommandStepModel'
import DataFrameStepModel from 'Model/Step/DataFrameStepModel'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import Rect from 'Shared/Step/Rect'
import SubFlowIcon from 'Shared/Icon/SubFlowIcon'
import style from './style.scss'
import SubFlowStepModel from 'Model/Step/SubFlowStepModel'
import NoteStepModel from 'Model/Step/NoteStepModel'
import ZoomUtil from 'Utils/ZoomUtil'
import InOutIcon from 'Shared/Icon/InOutIcon'
import type { StepModelType } from 'Types/index'
import CommandIcon from 'Shared/Icon/CommandIcon'
import APIUtil from 'Utils/APIUtil'
import ErrorIcon from 'Shared/Icon/ErrorIcon'
import Note from 'Shared/Step/Note'

let mouseMoveEvent
let mouseUpEvent

type Props = {
  ...FlowEditorProps,
  model: StepModelType;
  position: { x: number, y: number };
  type: string;
  selected: boolean;
  text: string;
  invalid: {};
  error: {};
}

type State = {
  coords: ?{ x: number, y: number };
  filter: string;
  hover: boolean
}

export default class Step extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      filter: 'url(#default-shadow)',
      coords: null,
      hover: false,
      active: false,
    }
  }

  /**
   * mouse down ステップ選択処理
   * @param e
   */
  handleMouseDown (e: MouseEvent) {

    this.updateStep(e)

    //mousedownされた位置の一時保存
    this.setState({
      coords: {
        x: e.pageX,
        y: e.pageY,
      },
    })
    //mousemoveイベントでハンドリング
    mouseMoveEvent = (e: MouseEvent) => this.handleMouseMove(e)
    mouseUpEvent = (e: MouseEvent) => this.handleMouseUp(e)
    document.addEventListener('mousemove', mouseMoveEvent, false)
    document.addEventListener('mouseup', mouseUpEvent, false)
  }

  /**
   * mouse up
   * @param e
   */
  handleMouseUp (e: MouseEvent) {
    this.updateStep(e)

    //一時保存された位置のクリア
    this.setState({
      coords: null,
    })

    let step = this.props.model
    //選択イベントの呼び出し
    if (e.shiftKey) {
      if (!this.isSelected()) {
        this.props.addSelectStep(step.id)
      } else {
        this.props.deleteSelectStep(step.id)
      }
    } else {
      //一度選択状態をクリアする（#71）
      this.props.selectSteps()

      this.props.selectSteps([step])

      //データフレームの詳細を取得する
      const selected_step: StepModelType = step//this.getSelectedStep()
      if (selected_step instanceof DataFrameStepModel) {
        if (selected_step.hasData()) {
          //TODO 将来的にはページングなどの対応が必要
          APIUtil.get('frames/' + selected_step.uuid + '?no_contents=1').then((response) => {
            const json = response.data
            this.props.updateDataFrameDetail(json.data)
          })
        } else {
          this.props.updateDataFrameDetail({})
        }
      } else {
        this.props.updateDataFrameDetail({})
      }
    }

    document.removeEventListener('mousemove', mouseMoveEvent)
    document.removeEventListener('mouseup', mouseUpEvent)
  }

  /**
   * mouse move ステップのドラッグ処理
   * @param e
   */
  handleMouseMove (e: MouseEvent) {

    this.updateStep(e)

    //一時保存された位置を更新
    this.setState({
      coords: {
        x: e.pageX,
        y: e.pageY,
      },
    })
  }

  updateStep (e: MouseEvent) {
    const {zoom} = this.props
    let coords_x = e.pageX
    let coords_y = e.pageY

    if (this.state.coords) {
      coords_x = this.state.coords.x
      coords_y = this.state.coords.y
    }

    //移動量から現在位置を割り出す
    const xDiff = coords_x - e.pageX
    const yDiff = coords_y - e.pageY
    const new_x = this.props.position.x - ZoomUtil.zoomReverse(xDiff, zoom)
    const new_y = this.props.position.y - ZoomUtil.zoomReverse(yDiff, zoom)

    //移動に応じてStepの位置を更新
    let step = this.props.model
    step.setPosition({x: new_x, y: new_y})
    this.props.updateStep(step)
  }

  /**
   * mouse over ホバー処理
   * @param e
   */
  handleMouseOver (e: MouseEvent) {
    //SVGに影をつける
    this.setState({
      hover: true,
    })
  }

  /**
   * mouse leave ホバー終了処理
   * @param e
   */
  handleMouseLeave (e: MouseEvent) {
    //SVGの影をクリア
    this.setState({
      hover: false,
    })
  }

  componentDidUpdate () {
    if (this.selectorIntersect()) {
      if (!this.isSelected()) {
        this.props.addSelectStep(this.props.model.id)
      }

    } else {
      if (this.isSelected()) {
        this.props.deleteSelectStep(this.props.model.id)
      }
    }
  }

  /**
   * 範囲選択との衝突判定
   */
  selectorIntersect () {
    const {zoom} = this.props
    const operator = {
      x: this.props.position.x,
      y: this.props.position.y,
      width: Constants.default.step.width,
      height: Constants.default.step.height,
    }

    const {start, end} = this.props.drag
    if (start && end) {
      //ref:http://gyabo.sakura.ne.jp/tips/rect.html

      let sx = (start.x <= end.x) ? start.x : end.x
      let sy = (start.y <= end.y) ? start.y : end.y
      let ex = (end.x >= start.x) ? end.x : start.x
      let ey = (end.y >= start.y) ? end.y : start.y

      sx = ZoomUtil.zoomReverse(sx, zoom)
      sy = ZoomUtil.zoomReverse(sy, zoom)
      ex = ZoomUtil.zoomReverse(ex, zoom)
      ey = ZoomUtil.zoomReverse(ey, zoom)

      /**
       isIntersect = (
       ((ex >= operator.x && sx <= operator.x) ||
       (ex >= operator.x + operator.width && sx <= operator.x + operator.width)) &&
       ((ey >= operator.y && sy <= operator.y) ||
       (ey >= operator.y + operator.height && sy <= operator.y + operator.height))
       )
       */
      const isIntersect = (sx <= operator.x + operator.width &&
        operator.x <= ex &&
        sy <= operator.y + operator.height &&
        operator.y <= ey)

      if (isIntersect) {
        return true
      } else {
        return false
      }
    }

    return this.isSelected()
  }

  isSelected (): boolean {
    let selected = false
    this.props.selected_step_ids.map((id) => {
      if (id === this.props.model.id) {
        selected = true
      }
    })
    return selected
  }

  isStep (model: modelProps): boolean {
    return (model instanceof CommandStepModel)
  }

  isDataFrame (model: modelProps): boolean {
    return (model instanceof DataFrameStepModel)
  }

  isSubFlow (model: modelProps): boolean {
    return (model instanceof SubFlowStepModel)
  }

  isNote (model: modelProps): boolean {
    return (model instanceof NoteStepModel)
  }

  getFilter () {
    // let filter = this.state.filter;
    // const step = this.props.model;
    // if (this.selectorIntersect()) {
    //     if (this.isOperator(step)) {
    //         filter = "url(#selected-operator-outline)"
    //     } else if (this.isDataSource(step)) {
    //         filter = "url(#selected-datasource-outline)"
    //     }
    // }else{
    //   filter = "url(#default-shadow)"
    // }
    const filter = 'url(#default-shadow)'
    return filter
  }

  render () {
    const {x, y} = this.props.position
    const {type, flow, invalid, error} = this.props
    const {ports} = this.props.flow
    let icon

    let step: StepModelType = this.props.model

    /**
     * STEPの種類に応じた見た目の設定
     */

    const filter = this.getFilter()

    let step_text = this.props.text
    let step_subtext = ''

    const hover = this.state.hover
    const selected = this.selectorIntersect()

    const flowIn = flow.hasInPortWithId(step.id)//(ports[0][step.id])
    const flowOut = flow.hasOutPortWithId(step.id)//(ports[1][step.id])

    let stepLabel = step.getLabel()

    if (flowIn || flowOut) {
      icon = <g>
        <Rect padding={5} selectedOutlineColor={'#93DFFF'} fillColor={'#FFFFFF'}
              hoverFillColor={'#E8F8FF'} selectedFillColor={'#E8F8FF'}
              hover={hover} selected={selected} stroke={'#63CFFD'}
              filter={filter} style={RectStyle}>
          <InOutIcon flowIn={flowIn} flowOut={flowOut} width={50} height={50} stroke={'#ccc'} fill={'#ccc'} />
        </Rect>
      </g>
    } else if (this.isSubFlow(step)) {
      icon = <SubFlowIcon hover={hover} selected={selected} filter={filter} />
      stepLabel = step.getLabel()
    } else if (this.isStep(step)) {
      //ステップ
      let command
      if (this.props.mast.commands) {
        this.props.mast.commands.forEach(c => {if (c.id === step.commandId) command = c})
        icon = <CommandIcon command={command} hover={hover} selected={selected} filter={filter} />
      }
      stepLabel = step.getLabel()
    } else if (this.isDataFrame(step)) {
      //データソース
      const stroke = (!step.hasData()) ? {stroke: '#CCCCCC'} : {}
      icon =
        <Rect padding={5} selectedOutlineColor={'#93DFFF'} fillColor={'#FFFFFF'}
              hoverFillColor={'#E8F8FF'} selectedFillColor={'#E8F8FF'}
              hover={hover} selected={selected} stroke={'#63CFFD'}
              filter={filter} style={RectStyle}>
          <FileIcon fillColor={(step.hasData()) ? '#63CFFD' : '#CCCCCC'}
                    width={16} height={20} />
        </Rect>
    } else if (this.isNote(step)) {
      let model = step
      icon =
        <Note hover={hover} selected={selected} model={step}></Note>

    }

    let invalid_icon = null
    let error_icon = null
    if ((Object.keys(invalid).length)) {
      invalid_icon = <ErrorIcon></ErrorIcon>
    }
    if ((Object.keys(error).length)) {
      error_icon = <ErrorIcon></ErrorIcon>
    }

    return (
      <g className={style.operator} transform={'translate(' + x + ',' + y + ')'}>
        <g className={style.iconContainer} onMouseDown={(e) => this.handleMouseDown(e)}
           onMouseOver={(e) => this.handleMouseOver(e)}
           onMouseLeave={(e) => this.handleMouseLeave(e)}>
          {icon}
        </g>
        {invalid_icon}
        {error_icon}
        <g className={style.labelContainer}>
          <foreignObject {...TextStyle} transform={'translate(' + (-1 * TextStyle.width) + ',0)'}>
            <div style={{
              display: 'table',
              width: '100%',
              height: TextStyle.height,
              paddingRight: TextStyle.padding + 'px'
            }}>
              <p xmlns="http://www.w3.org/1999/xhtml" style={{
                display: 'table-cell',
                verticalAlign: 'middle',
                textAlign: 'right',
                wordBreak: 'break-all'
              }}>{stepLabel}</p>
            </div>
          </foreignObject>
        </g>
      </g>
    )
  }
}

export const RectStyle = {
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  width: Constants.default.datasource.width,
  height: Constants.default.datasource.height,
  rx: 0,
  ry: 0,
  strokeWidth: 2,
}

export const CircleStyle = {
  cx: Constants.default.operator.cx,
  cy: Constants.default.operator.cy,
  tx: 0,
  ty: 0,
  fill: '#ffffff',
  stroke: '#FC9E28',
  r: Constants.default.operator.r,
  strokeWidth: 2,
}

export const TextStyle = {
  width: 80,
  height: 50,
  fontSize: 10,
  padding: 8
}

export const NoteStyle = {
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  width: Constants.default.note.width,
  height: Constants.default.note.height,
  rx: 0,
  ry: 0,
  strokeWidth: 2,
}