// @flow
import React from 'react'


type Props = {
  vx:number;
  vy:number;
  wx:number;
  wy:number;
}

const Edge = (props:Props) => {
  const {vx,vy,wx,wy} = props;
  return <path d={"M" + vx + "," + vy + " " + "L" + wx + "," + wy} stroke="gray" strokeWidth="1" />
}

export default Edge
