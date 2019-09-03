//@flow
import React from 'react'
import style from '../style.scss'

type PortProps = {
  x: number;
  y: number;
}

const Port = (props: PortProps) => {
  const {x, y} = props
  return <circle className={style.port} cx={x} cy={y} r={6}/>
}

export default Port
