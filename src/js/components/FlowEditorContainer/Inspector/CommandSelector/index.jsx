//@flow
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

    const sortedCommands = mast.commands.sort((commandA,commandB)=>{
      const a = commandA.classification.toUpperCase()
      const b = commandB.classification.toUpperCase()

      let comparison = 0
      if(a > b){
        comparison = 1
      }else if(a < b){
        comparison = -1
      }
      return comparison
    })

    let operators = sortedCommands.filter((command:CommandModel) => {
      if(command.ports){
        if(Object.keys(command.ports[0]).length === numberOfInput)return true
      }
      return false
    }).filter((command:CommandModel)=>{
      if (keyword === '') {
        return true
      }
      return (command.label.indexOf(keyword) != -1) ? true : false
    })

    let operatorsContainer = []
    let beforeCommand:CommandModel = null
    operators.map((command:CommandModel,index)=>{
      if(!beforeCommand || beforeCommand.classification != command.classification){
        //区切りを表示
        operatorsContainer.push(<div key={command.id} className={style.command_separator}>{command.classification}</div>)
      }
      operatorsContainer.push(<Command command={command} {...this.props} key={index}/>)
      beforeCommand = command
    })

    return <div>
    <TextField onChange={(e)=>this.onChangeKeyword(e)} placeholder={"キーワード"}/>
    <div className={style.property_basic_operators}>
    {operatorsContainer}
    </div>
    </div>
  }

}