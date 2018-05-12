import React from 'react'

const Edge = (props) => {
  const {vx,vy,wx,wy} = props;
  return <path d={"M" + vx + "," + vy + " " + "L" + wx + "," + wy} stroke="gray" strokeWidth="1" />
}

export default Edge
