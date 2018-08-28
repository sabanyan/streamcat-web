//@flow
import Constants from '../constants'
import type { CommandParamType, StepModelType, SubFlowParamType } from '../types'
import CommandModel from '../model/Command/CommandModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import HttpUtil from './HttpUtil'

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

  static getCommandParam(paramName:string,command:CommandModel):(CommandParamType|{}){
    let param = {};
    if(command && command.getParams()){
      command.getParams().map((_param)=>{
        if(_param.name === paramName){
          param = _param
        }
      })
    }
    return param
  }

  static getSubFlowParam(subflow:SubFlowStepModel,paramName:string):(SubFlowParamType|{}){
    let result = {}
    if(!subflow || !paramName)return null
    if(!subflow.params)return null

    subflow.params.forEach((param)=>{
      if(param.name === paramName){
        result = param
      }
    })
    return result
  }

  static getFlowJson(nodes:[],projectId:string,projectName:string):{}{
    const flow_json = {
      projectId: projectId,
      name: projectName,
      nodes: nodes,
    }
    return flow_json
  }

  /**
   * フローの保存
   * @param flowUUID
   * @param nodes
   * @param projectId
   * @param projectName
   * @returns {Promise<any>}
   */
  static save (flowUUID:string,nodes:[],projectId:string,projectName:string):any {
    return new Promise((resolve, reject) => {
      HttpUtil.put("flows/" + flowUUID,this.getFlowJson(nodes,projectId,projectName)).then((response)=>{
        resolve(response)
      })
    })
  }

}