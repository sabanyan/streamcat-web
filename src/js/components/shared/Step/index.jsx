//@flow
import React from 'react'
import { render } from 'react-dom'
import Constants from '../../../constants/index'
import FileIcon from '../Icon/FileIcon'
import type { CommandStepModelProps } from '../../../model/Step/CommandStepModel'
import type { DataFrameStepModelProps } from '../../../model/Step/DataFrameStepModel'
import type { FlowEditorProps } from '../../FlowEditorContainer'
import Rect from './Rect'
import OperatorIcon from '../Icon/OperatorIcon'
import SubFlowIcon from '../Icon/SubFlowIcon'
import style from './style.scss'
import CommandStepModel from '../../../model/Step/CommandStepModel'
import DataFrameStepModel from '../../../model/Step/DataFrameStepModel'
import SubFlowStepModel from '../../../model/Step/SubFlowStepModel'
import type { SubFlowStepModelProps } from '../../../model/Step/SubFlowStepModel'
import ZoomUtil from '../../../utils/ZoomUtil'
import InOutIcon from '../Icon/InOutIcon'
import type { StepModelType } from '../../../types'
import CommandIcon from '../Icon/CommandIcon'
import HttpUtil from '../../../utils/HttpUtil'

let mouseMoveEvent
let mouseUpEvent

type Props = {
  ...FlowEditorProps,
  model: StepModelType;
  position: { x: number, y: number };
  type: string;
  selected: boolean;
  text: string;
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
      }
      else {
        this.props.deleteSelectStep(step.id)
      }
    }
    else {
      //一度選択状態をクリアする（#71）
      this.props.selectSteps()

      this.props.selectSteps([step])


      //データフレームの詳細を取得する
      const selected_step:StepModelType = step//this.getSelectedStep()
      if (selected_step instanceof DataFrameStepModel) {
        if(selected_step.hasData()){
          HttpUtil.get("frames/"+selected_step.uuid).then((response)=>{
            const json = response.data
            this.props.updateDataFrameDetail(json.data)
          })
        }else{
          this.props.updateDataFrameDetail({})
        }
      }else{
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
    const new_x = this.props.position.x - ZoomUtil.zoomReverse(xDiff,zoom)
    const new_y = this.props.position.y - ZoomUtil.zoomReverse(yDiff,zoom)

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

    }
    else {
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

      sx = ZoomUtil.zoomReverse(sx,zoom)
      sy = ZoomUtil.zoomReverse(sy,zoom)
      ex = ZoomUtil.zoomReverse(ex,zoom)
      ey = ZoomUtil.zoomReverse(ey,zoom)

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
      }
      else {
        return false
      }
    }

    return this.isSelected()
  }

  isSelected ():boolean {
    let selected = false
    this.props.selected_step_ids.map((id) => {
      if (id === this.props.model.id) {
        selected = true
      }
    })
    return selected
  }

  isStep (model: modelProps):boolean {
    return (model instanceof CommandStepModel)
  }

  isDataFrame (model: modelProps):boolean {
    return (model instanceof DataFrameStepModel)
  }

  isSubFlow (model: modelProps):boolean {
    return (model instanceof SubFlowStepModel)
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
    const {type,flow} = this.props
    const {ports} = this.props.flow
    let icon

    let step:StepModelType = this.props.model

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
    if(flowIn || flowOut){
      icon = <g>
        <Rect padding={5} selectedOutlineColor={'#93DFFF'} fillColor={'#FFFFFF'}
              hoverFillColor={'#E8F8FF'} selectedFillColor={'#E8F8FF'}
              hover={hover} selected={selected} stroke={'#63CFFD'}
              filter={filter} style={RectStyle}>
          <InOutIcon flowIn={flowIn} flowOut={flowOut} width={50} height={50} stroke={"#ccc"} fill={"#ccc"}/>
        </Rect>
      </g>
    }else if(this.isSubFlow(step)){
      icon = <SubFlowIcon hover={hover} selected={selected} filter={filter}/>
    }else if (this.isStep(step)) {
      //ステップ
      let command
      if(this.props.mast.commands){
        this.props.mast.commands.forEach(c=>{if(c.id === step.commandId)command = c})
        icon = <CommandIcon command={command} hover={hover} selected={selected} filter={filter}/>
      }
    }else if (this.isDataFrame(step)) {
      //データソース
      const stroke = (!step.hasData()) ? {stroke: '#CCCCCC'} : {}
      icon =
        <Rect padding={5} selectedOutlineColor={'#93DFFF'} fillColor={'#FFFFFF'}
              hoverFillColor={'#E8F8FF'} selectedFillColor={'#E8F8FF'}
              hover={hover} selected={selected} stroke={'#63CFFD'}
              filter={filter} style={RectStyle}>
          <FileIcon fillColor={(step.hasData()) ? '#63CFFD' : '#CCCCCC'}
                    width={16} height={20}/>
        </Rect>
    }

    const stepLabel = step.getLabel()

    return (
      <g className={style.operator} transform={'translate(' + x + ',' + y + ')'}
         onMouseDown={(e) => this.handleMouseDown(e)}
         onMouseOver={(e) => this.handleMouseOver(e)}
         onMouseLeave={(e) => this.handleMouseLeave(e)}>
        {icon}
        <text className="text" transform={'translate(' + (-8) + ',' +
        (RectStyle.height / 2 + 6) + ')'} textAnchor="end"
              fontSize={12} width={100} height={100}>{stepLabel}</text>
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
