//@flow
import React from 'react'
//import classnames from 'classnames'
import style from './style.scss'
import Command from '../Command/index'
import type { FlowEditorProps } from '../../FlowEditorContainer/index'
import CommandModel from '../../../model/Command/CommandModel'
import TextField from '../TextField/index'
import Constants from '../../../constants/index'
import type { CommandModelType } from '../../../types'

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
    const isNoKeyword = (keyword.length == 0)
    let noOperators = true
    let sortedCommands:[]
    let subflowSortedCommands:[]
    sortedCommands = this.sortArray(window.commands,"id")
    sortedCommands = this.sortArray(sortedCommands,"classification")
    subflowSortedCommands = this.sortArray(window.subflows,"id")

    sortedCommands = [...subflowSortedCommands,...sortedCommands]

    let operators = sortedCommands.filter((command:CommandModelType) => {
      if(numberOfInput && command.ports){
        if(command.getInPorts().length === numberOfInput){
          return true
        }
      }
      return false
    }).filter((command:CommandModelType)=>{
      noOperators = false
      if (isNoKeyword) {
        return true
      }
      const foundLabelWithKeyword = (command.label && command.label.indexOf(keyword) != -1) ? true : false
      const foundDescriptionWithKeyword = (command.description && command.description.indexOf(keyword) != -1) ? true : false
      const foundCommandIdWithKeyword = (command.id && command.id.indexOf(keyword) != -1) ? true : false

      return (foundLabelWithKeyword | foundDescriptionWithKeyword | foundCommandIdWithKeyword)
    })
    let operatorsContainer = []
    let beforeCommand:CommandModelType = null
    operators.map((command:CommandModelType,index)=>{
      if(!beforeCommand || beforeCommand.classification != command.classification){
        //区切りを表示
        let label = Constants.lang.classification[command.classification]
        if(!label)label = command.classification
        operatorsContainer.push(<div key={command.id} className={style.command_separator}>{label}</div>)
      }
      operatorsContainer.push(<Command command={command} {...this.props} key={index}/>)
      beforeCommand = command
    })


    let commandSelector

    if(!noOperators){

      commandSelector = <div>
        <TextField onChange={(e,validation)=>this.onChangeKeyword(e,validation)} placeholder={"キーワード"}/>
        <div className={style.command_selector_container}>
          {(operatorsContainer.length)?operatorsContainer:<div className={style.command_not_found}>コマンドが見つかりませんでした</div>}
        </div>
      </div>
    }


    return <div>
      {commandSelector}
    </div>
  }

}