import React from 'react'
import { render } from 'react-dom'

export default class Shadow extends React.Component {
  constructor (props) {
    super(props)
  }

  /**
   * https://kadoppe.com/archives/2012/03/svg-drop-shadow.html
   * @returns {XML}
   */
  render () {
    return (
      <g>
        <filter id="hover-shadow" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" result="blur" stdDeviation="4" />
          <feOffset result="offsetBlur" dx="0" dy="0" />
          <feBlend in="SourceGraphic" in2="offsetBlur" mode="normal" />
        </filter>
        <filter id="selected-shadow" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.7" result="blur"/>
          <feOffset in="blur" dx="3" dy="3" result="offsetBlur"/>
          <feFlood floodColor="#3D4574" floodOpacity="0.5" result="offsetColor"/>
          <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"/>
        </filter>
      </g>
    )
  }
}
