// @flow
import React from 'react'
import Icon from '../index'
import type { IconProps } from '../index'
import Constants from '../../../../constants'

type InOutIconProps = {
  ...IconProps,
  flowIn: boolean;
  flowOut: boolean;
  fill: string;
  stroke: string;
}

class InOutIcon extends React.Component<InOutIconProps> {
  render () {
    const {flowIn, flowOut, width, height,fill,stroke} = this.props
    const padding = Constants.default.step.icon.padding
    let text
    if (flowIn && flowOut) {
      text = <text transform={'translate(' + (24) + ',' + 30 + ')'}
                   textAnchor="middle" width={width} height={height} fontSize={12} strokeWidth={1} stroke={stroke} fill={fill} strokeLinecap="round">IN/OUT</text>

    } else if (flowIn) {
      return (
        text = <text transform={'translate(' + (24) + ',' + 30 + ')'}
                     textAnchor="middle" width={width} height={height} strokeWidth={1} stroke={stroke} fill={fill} strokeLinecap="round">IN</text>
      )
    } else if (flowOut) {
      return (
        text = <text transform={'translate(' + (24) + ',' + 30 + ')'}
                     textAnchor="middle" width={width} height={height} strokeWidth={1} stroke={stroke} fill={fill} strokeLinecap="round">OUT</text>
      )
    }
    return (<g>
      <svg fill={fill} height={height} width={width}
           viewBox={'0 0 ' + width + ' ' + height}
           xmlns="http://www.w3.org/2000/svg">
        {text}
      </svg>
    </g>)
  }
}

export default InOutIcon