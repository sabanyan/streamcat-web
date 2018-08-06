//@flow
import Constants from '../constants'
import type { CommandParamType, SubFlowParamType } from '../types'
import CommandModel from '../model/Command/CommandModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'

export default class FlowUtil {
  static getCommand(commands:[],commandId:string):CommandModel{
    let command = null;
    commands.map((_command)=>{
      if(commandId === _command.id){
        command = _command
      }
    })
    return command
  }

  static getCommandParam(paramName:string,command:CommandModel):CommandParamType{
    let param = {};
    if(command && command.getParams()){
      command.getParams().map((_param)=>{
        if(_param.name == paramName){
          param = _param
        }
      })
    }
    return param
  }

  static getSubFlowParam(subflow:SubFlowStepModel,paramName:string):SubFlowParamType{
    let result
    if(subflow && paramName){
      subflow.params.forEach((param)=>{
        if(param.name === paramName){
          result = param
          return
        }
      })
    }
    return result
  }
}