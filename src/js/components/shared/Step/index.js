import React from 'react'
import { render } from 'react-dom'
import Constants from '../../../constants/index'
import { FileIcon, SortIcon, McutIcon } from '../../../icons/index'
import OperatorModel from '../../../model/OperatorModel'
import DataSourceModel from '../../../model/DataSourceModel'

let mouseMoveEvent
let mouseUpEvent

export default class Step extends React.Component {

  constructor (props) {
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
  handleMouseDown (e) {

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
    mouseMoveEvent = (e) => this.handleMouseMove(e)
    mouseUpEvent = (e) => this.handleMouseUp(e)
    document.addEventListener("mousemove", mouseMoveEvent, false);
    document.addEventListener("mouseup", mouseUpEvent, false);
  }

  /**
   * mouse up
   * @param e
   */
  handleMouseUp (e) {
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
  handleMouseMove (e) {

    this.updateStep(e)

    //一時保存された位置を更新
    this.setState({
      coords: {
        x: e.pageX,
        y: e.pageY
      }
    })
  }

  updateStep(e){
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
    step.setPosition(new_x, new_y)
    this.props.updateStep(step)
  }

  /**
   * mouse over ホバー処理
   * @param e
   */
  handleMouseOver (e) {
    //SVGに影をつける
    this.setState({
      filter: "url(#hover-shadow)"
    })
  }

  /**
   * mouse leave ホバー終了処理
   * @param e
   */
  handleMouseLeave (e) {
    //SVGの影をクリア
    this.setState({
      filter: ""
    })
  }

  render () {
    const {x, y} = this.props.position;
    const {type} = this.props;

    let icon

    const step = this.props.model

    /**
     * STEPの種類に応じた見た目の設定
     */
    let filter = (this.props.selected) ? "url(#hover-shadow)" : this.state.filter

    let step_text = this.props.text
    let step_subtext = ""

    if (step instanceof OperatorModel) {
      //ステップ
      switch (step.operator) {
        // case Constants.operatorType.msortf: {
        //   icon = <g>
        //     <circle filter={filter}  className="body" {...circle_style}>
        //     </circle>
        //     <SortIcon fillColor={"#FC9E28"} /></g>
        //   break;
        // }
        // case Constants.operatorType.mcut: {
        //   icon = <g>
        //     <circle filter={filter} className="body" {...circle_style}>
        //     </circle>
        //     <McutIcon fillColor={"#FC9E28"} /></g>
        //   break;
        // }
        default: {
          icon = <g>
            <circle filter={filter} className="body" {...circle_style}>
            </circle>
            {/*<McutIcon fillColor={"#FC9E28"} />*/}
          </g>
          break;
        }
      }


    } else if (step instanceof DataSourceModel) {
      //データソース
        const stroke = (!step.property.hasData)?{stroke:"#CCCCCC"}:{}
        const style = {...rect_style, ...stroke}
      icon = <g>
        <rect filter={filter}
              className="body" {...style}>
        </rect>
        <FileIcon fillColor={(step.property.hasData)?"#63CFFD":"#CCCCCC"} /></g>

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
        <text className="text" transform={"translate(" + (-50) + "," + (35 + 12 / 2) + ")"} textAnchor="middle"
              fontSize={12}>{step_text}</text>
        <text className="text" transform={"translate(" + (-50) + "," + (50 + 10 / 2) + ")"} textAnchor="middle"
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
  fill: "#ffffff",
  stroke: "#63CFFD",
  width: 80,
  height: 80,
  rx: 0,
  ry: 0,
  strokeWidth: 2
}

const circle_style = {
  cx: 40,
  cy: 40,
  tx: 0,
  ty: 0,
  fill: "#ffffff",
  stroke: "#FC9E28",
  r: 40,
  strokeWidth: 2
}
