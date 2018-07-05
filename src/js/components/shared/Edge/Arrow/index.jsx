// @flow
import React from 'react'

type ArrowProps = {
  x: number; //矢印の先端座標
  y: number; //矢印の先端座標
  width: number; //矢印の幅
  height: number;//矢印の高さ
  degree: number; //矢印の角度
}

const Arrow = (props: ArrowProps) => {
  const {x, y, width, height, angle} = props
console.log(props)
  return <polygon
    points={x + ',' + y + ' ' + (x - width / 2) + ',' + (y - height) + ' ' + (x + width / 2) + ',' + (y - height)}
    fill="white" stroke="black"
    strokeWidth="2" transform={'rotate(' + angle + ' ' + x + ' ' + y + ')'}>
  </polygon>
}

export default Arrow
