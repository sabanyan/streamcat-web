// @flow
import React from 'react'
import style from './style.scss'
import Constants from '../../../constants'

type Props = {
  vx: number;
  vy: number;
  wx: number;
  wy: number;
}

const Edge = (props: Props) => {
  const {label, vx, vy, wx, wy} = props

  let port = null
  if(Constants.debug){

    // const offset_x = ((vx - wx) >= 0) ? -1 * Constants.default.step.width / 2 - 10 : 1 * Constants.default.step.width / 2 + 10
    // const offset_y = ((vy - wy) >= 0) ? -1 * Constants.default.step.height / 2 - 10 : 1 * Constants.default.step.height / 2 + 10
    // const text_x = vx + offset_x //(wx-vx)/2 + vx + offset_x
    // const text_y = vy + offset_y //(wy-vy)/2 + vy + offset_y

    //center
    const text_x = (wx-vx)/2 + vx
    const text_y = (wy-vy)/2 + vy

    port = <text className="text" transform={'translate(' + text_x + ',' + text_y + ')'} fontSize={12} textAnchor={'middle'}
            width={100}>{label}</text>
  }

  return <g>
    <path className={style.edge}
          d={'M' + vx + ',' + vy + ' ' + 'L' + wx + ',' + wy} />
    <path className={style.base}
          d={'M' + vx + ',' + vy + ' ' + 'L' + wx + ',' + wy} />
    {port}
  </g>
}

export default Edge
