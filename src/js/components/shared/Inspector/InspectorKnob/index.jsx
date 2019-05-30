//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'

type Props = {
  onMouseDown: Function;
  onMouseMove: Function;
  onMouseUp: Function;
  isClosed: boolean;
}

class InspectorKnob extends React.Component<Props> {

  render () {
    return <div className={classnames(style.inspector_knob,
      {[style.isClosed]: this.props.isClosed})}
                onMouseMove={this.props.onMouseMove}
                onMouseDown={this.props.onMouseDown}
                onMouseUp={this.props.onMouseUp} />
  }

}

export default InspectorKnob