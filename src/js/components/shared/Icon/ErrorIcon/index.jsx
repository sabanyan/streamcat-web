//@flow
import React from 'react'
//import classnames from 'classnames'
//import style from './style.scss'

type Props = {}

export default class ErrorIcon extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
  }
  render () {
    return <g transform={"translate(" + 46 + "," + 4 + ")"}>
      <circle r="12" stroke="white" strokeWidth={2} fill="red">
      </circle>
      <text x={0} y={0} textAnchor="middle" dominantBaseline = "central" fill={"#fff"} style={{fontSize:"14px",fontWeight:"bold"}}>!</text>
    </g>
  }
}