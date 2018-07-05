// @flow
import React from 'react'
import style from './style.scss'
import Arrow from './Arrow'

type EdgeProps = {
  vx: number;
  vy: number;
  wx: number;
  wy: number;
}

// ref:https://www.s-projects.net/point-to-angle.html
const getEdgeAngle = (edge: EdgeProps) => {
  return Math.round(Math.atan((edge.wx - edge.vx) / (edge.wy - edge.vy)) / Math.PI * 180 * 1000) / 1000
}

const Edge = (props: EdgeProps) => {
  const {vx, vy, wx, wy} = props

  const angle = getEdgeAngle(props)

  console.log(props)
  return <g>
    <path className={style.edge}
          d={'M' + vx + ',' + vy + ' ' + 'L' + wx + ',' + wy}/>
    <path className={style.base}
          d={'M' + vx + ',' + vy + ' ' + 'L' + wx + ',' + wy}/>
    <Arrow x={wx} y={wy} width={8} height={8} angle={angle}/>
  </g>
}

export default Edge
