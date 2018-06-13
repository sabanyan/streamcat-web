// @flow
import React from 'react'
import { render } from 'react-dom'
import Constants from '../../../constants/index'
import FileIcon from '../Icon/FileIcon'
import OperatorModel  from '../../../model/OperatorModel'
import type {OperatorModelProps} from '../../../model/OperatorModel'
import DataSourceModel from '../../../model/DataSourceModel'
import type {DataSourceModelProps} from '../../../model/DataSourceModel'
import type { FlowEditorProps } from '../../FlowEditorContainer'
import Rect from "./Rect";
import OperatorIcon from "../Icon/OperatorIcon";
import style from './style.scss'

let mouseMoveEvent
let mouseUpEvent

type modelProps = {
  model: OperatorModelProps | DataSourceModelProps
}

type Props = {
  ...FlowEditorProps,
  ...modelProps,
  position:{x:number,y:number};
  type: string;
  selected: boolean;
  text: string;
}

type State = {
  coords: ?{x:number,y:number};
  filter:string;
  hover: boolean
}

export default class Step extends React.Component<Props,State> {

  constructor (props:Props) {
    super(props)
    this.state = {
      filter: "url(#default-shadow)",
      coords: null,
        hover:false,
        active:false
    }
  }

  /**
   * mouse down ステップ選択処理
   * @param e
   */
  handleMouseDown (e:MouseEvent) {

    this.updateStep(e)

    //mousedownされた位置の一時保存
    this.setState({
      coords: {
        x: e.pageX,
        y: e.pageY
      }
    })
    let step = this.props.model
    //選択イベントの呼び出し
    if(e.shiftKey){
        if(!this.isSelected()){
            this.props.addSelectStep(step.id)
        }else{
            this.props.deleteSelectStep(step.id)
        }
    }else{
        this.props.selectSteps([step])
    }
    //mousemoveイベントでハンドリング
    mouseMoveEvent = (e:MouseEvent) => this.handleMouseMove(e)
    mouseUpEvent = (e:MouseEvent) => this.handleMouseUp(e)
    document.addEventListener("mousemove", mouseMoveEvent, false);
    document.addEventListener("mouseup", mouseUpEvent, false);
  }

  /**
   * mouse up
   * @param e
   */
  handleMouseUp (e:MouseEvent) {
    this.updateStep(e)

    //一時保存された位置のクリア
    this.setState({
      coords: null
    })
    document.removeEventListener("mousemove", mouseMoveEvent);
    document.removeEventListener("mouseup", mouseUpEvent);
  }

  /**
   * mouse move ステップのドラッグ処理
   * @param e
   */
  handleMouseMove (e:MouseEvent) {

    this.updateStep(e)

    //一時保存された位置を更新
    this.setState({
      coords: {
        x: e.pageX,
        y: e.pageY
      }
    })
  }

  updateStep(e:MouseEvent){
    let coords_x = e.pageX
    let coords_y = e.pageY

    if (this.state.coords){
      coords_x = this.state.coords.x
      coords_y = this.state.coords.y
    }

    //移動量から現在位置を割り出す
    const xDiff = coords_x - e.pageX
    const yDiff = coords_y - e.pageY
    const new_x = this.props.position.x - xDiff
    const new_y = this.props.position.y - yDiff

    //移動に応じてStepの位置を更新
    let step = this.props.model
    step.setPosition({x:new_x,y:new_y})
    this.props.updateStep(step)
  }

  /**
   * mouse over ホバー処理
   * @param e
   */
  handleMouseOver (e:MouseEvent) {
    //SVGに影をつける
    this.setState({
      hover: true
    })
  }

  /**
   * mouse leave ホバー終了処理
   * @param e
   */
  handleMouseLeave (e:MouseEvent) {
    //SVGの影をクリア
    this.setState({
      hover: false
    })
  }

  componentDidUpdate(){
    if(this.selectorIntersect()){
      if(!this.isSelected()){
        this.props.addSelectStep(this.props.model.id)
      }

    }else{
      if(this.isSelected()){
        this.props.deleteSelectStep(this.props.model.id)
      }
    }
  }

  /**
   * 範囲選択との衝突判定
   */
  selectorIntersect(){
    const operator = {
      x: this.props.position.x,
      y: this.props.position.y,
      width: Constants.default.step.width,
      height: Constants.default.step.height
    }

    const {start,end} = this.props.drag
    if(start && end){
      //ref:http://gyabo.sakura.ne.jp/tips/rect.html

      const sx = (start.x <= end.x)?start.x:end.x
      const sy = (start.y <= end.y)?start.y:end.y
      const ex = (end.x >= start.x)?end.x:start.x
      const ey = (end.y >= start.y)?end.y:start.y

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

      if(isIntersect){
        return true
      }else{
        return false
      }
    }

    return this.isSelected()
  }

  isSelected(){
    let selected = false
    this.props.selected_step_ids.map((id) => {
      if(id === this.props.model.id){
        selected = true
      }
    })
    return selected
  }

  isOperator(model:modelProps){
    return (model instanceof OperatorModel)
  }

  isDataSource(model:modelProps){
    return (model instanceof DataSourceModel)
  }

  getFilter(){
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
      const filter = "url(#default-shadow)"
      return filter
  }

  render () {
    const {x, y} = this.props.position;
    const {type} = this.props;

    let icon

    const step = this.props.model

    /**
     * STEPの種類に応じた見た目の設定
     */

    const filter = this.getFilter()

    let step_text = this.props.text
    let step_subtext = ""

    const hover = this.state.hover
    const selected = this.selectorIntersect()

    if (this.isOperator(step)) {
      //ステップ
      icon = <g>
          <Rect padding={5} selectedOutlineColor={"#FFD263"} fillColor={"#FFFFFF"} hoverFillColor={"#FFF6E4"} selectedFillColor={"#FFF6E4"} hover={hover} selected={selected} stroke={"#FFB300"} filter={filter} style={{...rect_style,rx:12,ry:12}}>
              <OperatorIcon fillColor={"#F4B63F"} width={16} height={17}/>
          </Rect>
      </g>

    } else if (this.isDataSource(step)) {
      //データソース
        const stroke = (!step.property.hasData)?{stroke:"#CCCCCC"}:{}
        icon = <Rect padding={5} selectedOutlineColor={"#93DFFF"} fillColor={"#FFFFFF"} hoverFillColor={"#E8F8FF"} selectedFillColor={"#E8F8FF"} hover={hover} selected={selected} stroke={"#63CFFD"} filter={filter} style={rect_style}>
                <FileIcon fillColor={(step.property.hasData)?"#63CFFD":"#CCCCCC"}  width={16} height={20}/>
            </Rect>
      //データソースの場合のみ
      if(step.getFileName()){
        step_subtext = step.getFileName()
      }
    }

    return (
      <g className={style.operator} transform={"translate(" + x + "," + y + ")"}
         onMouseDown={(e) => this.handleMouseDown(e)}
         onMouseOver={(e) => this.handleMouseOver(e)}
         onMouseLeave={(e) => this.handleMouseLeave(e)}>
        {icon}
        <text className="text" transform={"translate(" + (-50) + "," + (rect_style.height / 2 - 6) + ")"} textAnchor="middle"
              fontSize={12}>{step_text}</text>
        <text className="text" transform={"translate(" + (-50) + "," + (rect_style.height / 2 + 6) + ")"} textAnchor="middle"
              fontSize={10}>{step_subtext}</text>
      </g>
    )
  }
}

const rect_style = {
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

const circle_style = {
  cx: Constants.default.operator.cx,
  cy: Constants.default.operator.cy,
  tx: 0,
  ty: 0,
  fill: "#ffffff",
  stroke: "#FC9E28",
  r: Constants.default.operator.r,
  strokeWidth: 2
}
