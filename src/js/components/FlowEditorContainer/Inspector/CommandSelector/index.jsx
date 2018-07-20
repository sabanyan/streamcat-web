// @flow
import React from 'react'
//import classnames from 'classnames'
import style from '../style.scss'
import Operator from '../../../shared/Operator'

import type { FlowEditorProps } from '../../index'

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

    let operators = mast.commands.filter((command) => {
      
      if(command["signature"]){
        if(Object.keys(command.signature[0]).length === numberOfInput)return true
      }

      //以下2行はコマンド一覧が最新化されるまでの暫定処置
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