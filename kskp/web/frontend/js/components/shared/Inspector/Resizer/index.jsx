//@flow
import * as React from 'react'
import style from '../style.scss'
import classnames from 'classnames'
import InspectorKnob from '../InspectorKnob'
import Constants from '../../../../constants'

let mouseMoveEvent
let mouseUpEvent

type Props = {
  children: React.Node;
}

type State = {
  isDragging: boolean;
  isClosed: boolean;
  willClosed: boolean;
  width: number;
}

class Resizer extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      isDragging: false,
      isClosed: false,
      willClosed: false,
      width: Constants.default.inspector.width,
    }
  }

  componentDidMount () {

  }

  onMouseDown (e: Event) {
    this.setState({
      isDragging: true,
    })
    if (this.state.isClosed) {
      this.setState({
        width: Constants.default.inspector.width,
        isClosed: false,
        willClosed: false,
      })
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
    const zeroPoint = window.innerWidth - Constants.default.inspector.width
    const closedPoint = window.innerWidth - Constants.default.inspector.width +
      Constants.default.inspector.width *
      Constants.default.inspector.closingRatio

    if (e.pageX > closedPoint) {
      //閉じる
      this.setState(
        {width: Constants.default.inspector.closedWidth, isClosed: true})
    }
    if (e.pageX > zeroPoint) {
      //閉じる
      this.setState({willClosed: true})
    } else {
      //広げる
      const newWidth = window.innerWidth - e.pageX
      if (newWidth >= Constants.default.inspector.width && newWidth <=
        Constants.default.inspector.maxWidth) {
        this.setState({width: newWidth, willClosed: false})
      }
    }
  }

  render () {
    const {children} = this.props
    const {width, isClosed, isDragging, willClosed} = this.state
    let childrendElement = children
    if (isClosed) {
      childrendElement = null
    }

    return <div className={classnames(style.property, style.in,
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