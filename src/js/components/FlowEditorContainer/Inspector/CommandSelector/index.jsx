// @flow
import React from 'react'
//import classnames from 'classnames'
import style from '../style.scss'
import Operator from '../../../shared/Operator'

import type { FlowEditorProps } from '../../index'

export default class CommandSelector extends React.Component<FlowEditorProps> {

  constructor (props: FlowEditorProps) {
    super(props)
  }

  render () {
    const {mast,numberOfInput} = this.props

    let operators = mast.commands.filter((command) => {
      if(!command["inputs"])return false
      if(command.inputs.length === numberOfInput)return true
      return false
    }).map((command,index)=>{
      return <Operator {...command} {...this.props} key={index}/>
    })

    if(!operators.length)return null

    return <div><div className={style.property_title}>
      コマンド
    </div>
    <div className={style.property_basic_operators}>
    {operators}
    </div>
    </div>
  }

}