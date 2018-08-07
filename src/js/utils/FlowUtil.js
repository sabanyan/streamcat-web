//@flow
import Constants from '../constants'
import type { CommandParamType, StepModelType, SubFlowParamType } from '../types'
import CommandModel from '../model/Command/CommandModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'

export default class FlowUtil {

  static getAllDataFrame(nodes:[StepModelType]){
    return nodes.filter((node)=>{
      if(node instanceof DataFrameStepModel){
        return true
      }
      return false
    })
  }

  static getNodeFromID(nodes:[StepModelType],id:string){
    return nodes.find((node)=>{
      if(node instanceof DataFrameStepModel){
        return (node.id === id)
      }
      return false
    })
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
    console.log(subflow)
    if(!subflow || !paramName)return null
    if(!subflow.params)return null

    subflow.params.forEach((param)=>{
      if(param.name === paramName){
        result = param
        return
      }
    })
    return result
  }
}