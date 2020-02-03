import * as React from 'react'
import style from '../style.scss'
import classnames from 'classnames'
import { InspectorKnob } from 'Shared/Inspector'
import Constants from 'Constants/index'
import { HttpUtil  } from "Utils/index";

let mouseMoveEvent
let mouseUpEvent

type Props = {
  children: React.ReactNode;
  inspector: {width:number};

  resizeInspector: Function
}

type State = {
  isDragging: boolean;
  isClosed: boolean;
  willClosed: boolean;
}

class Resizer extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      isDragging: false,
      isClosed: false,
      willClosed: false,
    }
  }

  componentDidMount () {

  }

  onMouseDown (e: Event) {
    const {resizeInspector} = this.props

    this.setState({
      isDragging: true,
    })
    if (this.state.isClosed) {
      this.setState({
        isClosed: false,
        willClosed: false,
      })
      resizeInspector(Constants.default.inspector.width)
    }
    //mousemoveイベントでハンドリング
    mouseMoveEvent = (e: MouseEvent) => this.onMouseMove(e)
    mouseUpEvent = (e: MouseEvent) => this.onMouseUp(e)
    document.addEventListener('mousemove', mouseMoveEvent, false)
    document.addEventListener('mouseup', mouseUpEvent, false)
  }

  onMouseUp (e: Event) {
    this.setState({
      isDragging: false,
      willClosed: false,
    })
    document.removeEventListener('mousemove', mouseMoveEvent)
    document.removeEventListener('mouseup', mouseUpEvent)
  }

  onMouseMove (e: MouseEvent) {
    if (this.state.isDragging) {
      this.onResize(e)
    }
  }

  onResize (e: MouseEvent) {
    const {resizeInspector} = this.props
    const zeroPoint = window.innerWidth - Constants.default.inspector.width
    const closedPoint = window.innerWidth - Constants.default.inspector.width +
      Constants.default.inspector.width *
      Constants.default.inspector.closingRatio

    if (e.pageX > closedPoint) {
      //閉じる
      this.setState(
        {isClosed: true}, () => {
          resizeInspector(Constants.default.inspector.closedWidth)
        })
    }
    if (e.pageX > zeroPoint) {
      //閉じる
      this.setState({willClosed: true})
    } else {
      //広げる
      const newWidth = window.innerWidth - e.pageX
      if (newWidth >= Constants.default.inspector.width && newWidth <=
        Constants.default.inspector.maxWidth) {
        this.setState({willClosed: false},
          () => {
            resizeInspector(newWidth)
          })
      }
    }
  }

  isDialog () {
    return (HttpUtil.getURLParam('dialog'))
  }

  render () {
    const {children, inspector} = this.props
    const {isClosed, isDragging, willClosed} = this.state
    let childrendElement = children
    if (isClosed) {
      childrendElement = null
    }

    let width = (inspector) ? inspector.width : Constants.default.inspector.width 
    let styleName = (this.isDialog()) ? style.property_dialog : style.property

    return <div className={classnames(styleName, style.in,
      {
        [style.isClosed]: isClosed,
        [style.isDragging]: isDragging,
        [style.willClosed]: willClosed,
      })}
                style={{width: width}}>
      <InspectorKnob
        onMouseMove={(e) => this.onMouseMove(e)}
        onMouseDown={(e) => this.onMouseDown(e)}
        onMouseUp={(e) => this.onMouseUp(e)}
        isClosed={isClosed}
      />
      {childrendElement}
    </div>
  }

}

export default Resizer