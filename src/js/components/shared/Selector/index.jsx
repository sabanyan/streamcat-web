// @flow
import * as React from 'react'
import Constants from '../../../constants'
import style from './style.scss'

type Props = {
  sx: number,
  sy: number,
  ex: number,
  ey: number
}

class Selector extends React.Component<Props> {
  static defaultProps = {
    r: 0,
  }

  render () {
    const {sx, sy, ex, ey} = this.props
    return <g>
      <path className={style.selector}
            d={'M' + sx + ',' + sy + ' ' + 'L' + ex + ',' + sy + ' ' + ex +
            ',' + ey + ' ' + sx + ',' + ey + ' z'} fill="none"/>
    </g>
  }
}

export default Selector