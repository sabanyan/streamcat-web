//@flow
import React from 'react'
//import classnames from 'classnames'
import style from './style.scss'
import Command from '../../Command/index'

import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import CommandModel from '../../../../model/Command/CommandModel'
import TextField from '../../TextField/index'
import DataFrameStepModel from '../../../../model/Step/DataFrameStepModel'
import ModalUtil from '../../../../utils/ModalUtil'
import type { StepModelType } from '../../../../types/index'
import Constants from '../../../../constants/index'
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

  sortArray(array:[],key:string):[]{
    return array.sort((objectA,objectB)=>{
      const a = objectA[key]
      const b = objectB[key]
      let comparison = 0
      if(a > b){
        comparison = 1
      }else if(a < b){
        comparison = -1
      }
      return comparison
    })
  }

  render () {
    const {mast,numberOfInput} = this.props
    const {keyword} = this.state

    let sortedCommands:[]
    sortedCommands = this.sortArray(mast.commands,"id")
    sortedCommands = this.sortArray(sortedCommands,"classification")

    let operators = sortedCommands.filter((command:CommandModel) => {
      if(command.ports){
        if(Object.keys(command.ports[0]).length === numberOfInput)return true
      }
      return false
    }).filter((command:CommandModel)=>{
      if (keyword === '') {
        return true
      }
      console.log(command)
      const foundLabelWithKeyword = (command.label && command.label.indexOf(keyword) != -1) ? true : false
      const foundDescriptionWithKeyword = (command.description && command.description.indexOf(keyword) != -1) ? true : false
      const foundCommandIdWithKeyword = (command.id && command.id.indexOf(keyword) != -1) ? true : false

      return (foundLabelWithKeyword | foundDescriptionWithKeyword | foundCommandIdWithKeyword)
    })

    let operatorsContainer = []
    let beforeCommand:CommandModel = null
    operators.map((command:CommandModel,index)=>{
      if(!beforeCommand || beforeCommand.classification != command.classification){
        //区切りを表示
        let label = Constants.lang.classification[command.classification]
        if(!label)label = command.classification
        operatorsContainer.push(<div key={command.id} className={style.command_separator}>{label}</div>)
      }
      operatorsContainer.push(<Command command={command} {...this.props} key={index}/>)
      beforeCommand = command
    })

    return <div>
    <TextField onChange={(e)=>this.onChangeKeyword(e)} placeholder={"キーワード"}/>
      <div className={style.command_selector_container}>
        {operatorsContainer}
      </div>
    </div>
  }

}