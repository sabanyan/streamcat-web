// @flow
import React from 'react'
import style from '../style.scss'

type ArrowProps = {
  x: number; //矢印の先端座標
  y: number; //矢印の先端座標
  width: number; //矢印の幅
  height: number;//矢印の高さ
  degree: number; //矢印の角度
  className: string;
}

const Arrow = (props: ArrowProps) => {
  const {x, y, width, height, angle, className} = props
  return <polygon
    points={x + ',' + y + ' ' + (x - width / 2) + ',' + (y - height) + ' ' + (x + width / 2) + ',' + (y - height)}
    className={className}
    transform={'rotate(' + angle + ' ' + x + ' ' + y + ')'}>
  </polygon>
}

export default Arrow
