// @flow
import React from 'react'
import { render } from 'react-dom'
import Constants from '../../../constants/index'
import FileIcon from '../Icon/FileIcon'
import OperatorModel from '../../../model/OperatorModel'
import DataSourceModel from '../../../model/DataSourceModel'
import type { FlowEditorProps } from '../../FlowEditorContainer'

let mouseMoveEvent
let mouseUpEvent


type Props = {
  ...FlowEditorProps,
  model: OperatorModel | DataSourceModel;
  position:{x:number,y:number};
  type: string;
  selected: boolean;
  text: string;
}

type State = {
  coords: ?{x:number,y:number};
  filter:string;
}

export default class Step extends React.Component<Props,State> {

  constructor (props:Props) {
    super(props)
    this.state = {
      filter: "",
      coords: null
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
    this.props.selectSteps([step])
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
      filter: "url(#hover-shadow)"
    })
  }

  /**
   * mouse leave ホバー終了処理
   * @param e
   */
  handleMouseLeave (e:MouseEvent) {
    //SVGの影をクリア
    this.setState({
      filter: ""
    })
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

      if(sx <= operator.x + operator.width &&
        operator.x <= ex &&
        sy <= operator.y + operator.height &&
        operator.y <= ey){
        return true
      }
    }
    return false
  }

  render () {
    const {x, y} = this.props.position;
    const {type} = this.props;

    let icon

    const step = this.props.model

    /**
     * STEPの種類に応じた見た目の設定
     */
    let filter = (this.selectorIntersect()) ? "url(#selected-shadow)" : this.state.filter

    let step_text = this.props.text
    let step_subtext = ""

    if (step instanceof OperatorModel) {
      //ステップ
      icon = <g>
          <Rect padding={5} fillColor={"#FFF6E4"} stroke={"#FFB300"} filter={filter} style={{...rect_style,rx:12,ry:12}}>
              <OperatorIcon fillColor={"#F4B63F"} width={16} height={17}/>
          </Rect>
      </g>

    } else if (step instanceof DataSourceModel) {
      //データソース
        const stroke = (!step.property.hasData)?{stroke:"#CCCCCC"}:{}
        icon = <Rect padding={5} fillColor={"#E8F8FF"} stroke={"#63CFFD"} filter={filter} style={rect_style}>
                <FileIcon fillColor={(step.property.hasData)?"#7ECDF8":"#CCCCCC"}  width={16} height={20}/>
            </Rect>
      //データソースの場合のみ
      if(step.getFileName()){
        step_subtext = step.getFileName()
      }
    }

    return (
      <g className="operator" transform={"translate(" + x + "," + y + ")"}
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
  strokeWidth: 2
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
