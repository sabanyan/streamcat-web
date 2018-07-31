// @flow
import React from 'react'
//import classnames from 'classnames'
import style from './style.scss'
import Command from '../../../shared/Command'

import type { FlowEditorProps } from '../../index'
import CommandModel from '../../../../model/Command/CommandModel'
import TextField from '../../../shared/TextField'
import DataFrameStepModel from '../../../../model/Step/DataFrameStepModel'
import ModalUtil from '../../../../utils/ModalUtil'
import type { StepModelType } from '../../../../types'
import Constants from '../../../../constants'
import HttpUtil from '../../../../utils/HttpUtil'
import CommandStepModel from '../../../../model/Step/CommandStepModel'
import Graph from '../../../../utils/Graph'

type CommandSelectorProps = {
  ...FlowEditorProps,
  numberOfInput:number
}

export default class CommandSelector extends React.Component<CommandSelectorProps> {

  constructor (props: CommandSelectorProps) {
    super(props)
    this.state = {
      keyword: ''
    }
  }

  onChangeKeyword(e){
    this.setState({keyword: e.target.value})
  }

  render () {
    const {mast,numberOfInput} = this.props
    const {keyword} = this.state
    let operators = mast.commands.filter((command:CommandModel) => {
      if(command.ports){
        if(Object.keys(command.ports[0]).length === numberOfInput)return true
      }
      return false
    }).filter((command:CommandModel)=>{
      console.log(command.label.indexOf(keyword))
      if (keyword === '') {
        return true
      }
      return (command.label.indexOf(keyword) != -1) ? true : false
    }).map((command:CommandModel,index)=>{
      return <Command command={command} {...this.props} key={index}/>
    })

    return <div><div className={style.property_title}>
      コマンド
    </div>
    <TextField onChange={(e)=>this.onChangeKeyword(e)} placeholder={"キーワード"}/>
    <div className={style.property_basic_operators}>
    {operators}
    </div>
    </div>
  }

}