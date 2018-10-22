//@flow
import Constants from '../../constants/index'
import ModelUtil from '../../utils/ModelUtil'
import BaseStepModel from './BaseStepModel'
import BaseModelProps from './BaseStepModel'
import type { CommandModelType, CommandParamType } from '../../types'
import CommandModel from '../Command/CommandModel'

type stepType = "command" | "frame"

export type CommandStepModelProps = {
  ...BaseModelProps,
  srcs: {};
  dsts: {};
  args: {};
  commandId: string;
  getSrcsSteps: Function;
  getDstsSteps: Function;
  getCommand: Function;
}

export default class CommandStepModel extends BaseStepModel{
  srcs: {} = {}
  dsts: {} = {}
  args: {} = {}
  commandId: string
  constructor (props: CommandStepModelProps) {
    super(props)
    this.initialize(props,"srcs")
    this.initialize(props,"dsts")
    this.initialize(props,"args")
    this.initialize(props,"commandId")
  }

  getStep(nodes,key){
    let step = nodes.find((node)=>{
      return node.id === key
    })
    return step
  }


  getSrcsSteps(nodes){
    let steps = {}
    Object.keys(this.srcs).forEach((key)=>{
      const stepId = this.srcs[key]
      steps[stepId] = {
        id:stepId,
        portName:key,
        node:this.getStep(nodes,stepId)
      }
    })
    return steps
  }

  getDstsSteps(nodes){
    let steps = {}
    return Object.keys(this.dsts).map((key)=>{
      const stepId = this.dsts[key]
      steps[stepId] = this.getStep(nodes,stepId)
    })
    return steps
  }

  getCommand():CommandModel{
    let command = null;
    window.commands.forEach((_command)=>{
      if(this.commandId === _command.id){
        command = _command
      }
    })
    return command
  }


  validate(){

    this.invalid = {}

    //必須バリデーション
    Object.keys(this.args).map(key => {
      let command:CommandModel = this.getCommand()
      const value = this.args[key]
      const param:CommandParamType = command.getParam(key)
      if(!param.optional){
        if(value === "" || value === null){
          this.invalid[key] = "入力が必須の項目です"
        }
      }
    })

  }
}