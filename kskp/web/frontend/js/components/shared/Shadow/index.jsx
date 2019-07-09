//@flow
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
      <defs>
        <filter id="default-shadow" x="-50%" y="-50%" width="200%"
                height="200%">
          <feComponentTransfer in="SourceAlpha">
            <feFuncR type="discrete" tableValues="0.4" />
            <feFuncG type="discrete" tableValues="0.4" />
            <feFuncB type="discrete" tableValues="0.4" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="3" />
          <feOffset dx="0" dy="1" result="shadow" />
          <feComposite in="SourceGraphic" in2="shadow" operator="over" />
        </filter>
        {/*<filter id="selected-datasource-shadow" x="-50%" y="-50%" width="200%" height="200%">*/}
        {/*<feComponentTransfer in="SourceAlpha">*/}
        {/*<feFuncR type="discrete" tableValues="0"/>*/}
        {/*<feFuncG type="discrete" tableValues="0"/>*/}
        {/*<feFuncB type="discrete" tableValues="0.5"/>*/}
        {/*</feComponentTransfer>*/}
        {/*<feGaussianBlur stdDeviation="2"/>*/}
        {/*<feOffset dx="0" dy="0" result="shadow"/>*/}
        {/*<feComposite in="SourceGraphic" in2="shadow" operator="over"/>*/}
        {/*</filter>*/}
        {/*<filter id="selected-operator-shadow" x="-50%" y="-50%" width="200%" height="200%">*/}
        {/*<feComponentTransfer in="SourceAlpha">*/}
        {/*<feFuncR type="discrete" tableValues="0"/>*/}
        {/*<feFuncG type="discrete" tableValues="0.5"/>*/}
        {/*<feFuncB type="discrete" tableValues="0"/>*/}
        {/*</feComponentTransfer>*/}
        {/*<feGaussianBlur stdDeviation="2"/>*/}
        {/*<feOffset dx="0" dy="0" result="shadow"/>*/}
        {/*<feComposite in="SourceGraphic" in2="shadow" operator="over"/>*/}
        {/*</filter>*/}
        {/*<filter id="selected-subflow-shadow" x="-50%" y="-50%" width="200%" height="200%">*/}
        {/*<feComponentTransfer in="SourceAlpha">*/}
        {/*<feFuncR type="discrete" tableValues="0.5"/>*/}
        {/*<feFuncG type="discrete" tableValues="0"/>*/}
        {/*<feFuncB type="discrete" tableValues="0"/>*/}
        {/*</feComponentTransfer>*/}
        {/*<feGaussianBlur stdDeviation="2"/>*/}
        {/*<feOffset dx="0" dy="0" result="shadow"/>*/}
        {/*<feComposite in="SourceGraphic" in2="shadow" operator="over"/>*/}
        {/*</filter>*/}
      </defs>
    )
  }
}
