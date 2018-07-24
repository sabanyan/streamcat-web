// @flow
import React from 'react'
//import classnames from 'classnames'
import style from '../style.scss'
import Command from '../../../shared/Command'

import type { FlowEditorProps } from '../../index'
import CommandModel from '../../../../model/Command/CommandModel'

type CommandSelectorProps = {
  ...FlowEditorProps,
  numberOfInput:number
}

export default class CommandSelector extends React.Component<CommandSelectorProps> {

  constructor (props: CommandSelectorProps) {
    super(props)
  }

  render () {
    const {mast,numberOfInput} = this.props

    let operators = mast.commands.filter((command:CommandModel) => {
      
      if(command.ports){
        if(Object.keys(command.ports[0]).length === numberOfInput)return true
      }

      return false
    }).map((command:CommandModel,index)=>{
      return <Command command={command} {...this.props} key={index}/>
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