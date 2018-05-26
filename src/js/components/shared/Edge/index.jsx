// @flow
import React from 'react'
import style from './style.scss'

type Props = {
  vx:number;
  vy:number;
  wx:number;
  wy:number;
}

const Edge = (props:Props) => {
  const {vx,vy,wx,wy} = props;
  return <g>
    <path className={style.edge} d={"M" + vx + "," + vy + " " + "L" + wx + "," + wy}/>
    <path className={style.base} d={"M" + vx + "," + vy + " " + "L" + wx + "," + wy}/>
  </g>
}

export default Edge
