//@flow
import Constants from '../constants'
import type { CommandParamType, StepModelType, SubFlowParamType } from '../types'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import HttpUtil from './HttpUtil'
import CommandStepModel from '../model/Step/CommandStepModel'
import Validator from './Validator'

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

  // /**
  //  * ノードのdsts,srcsのNodeIdをすべて書き換える
  //  * @param replaceKeyPairs
  //  * @param nodes
  //  */
  // static replaceNodeIds(replaceKeyPairs:{},nodes:[]){
  //   nodes.map((node)=>{
  //     if(node.dsts){
  //       let newDsts = {}
  //       Object.keys(node.dsts).forEach((from)=>{
  //         const newFromId = this.replaceNodeId(replaceKeyPairs,from)
  //         const to = node.dsts[from]
  //         const newToId = this.replaceNodeId(replaceKeyPairs,to)
  //         newDsts[newFromId] = newToId
  //       })
  //       node.dsts = newDsts
  //     }
  //
  //     if(node.srcs){
  //       let newSrcs = {}
  //       Object.keys(node.srcs).forEach((from)=>{
  //         const newFromId = this.replaceNodeId(replaceKeyPairs,from)
  //         const to = node.srcs[from]
  //         const newToId = this.replaceNodeId(replaceKeyPairs,to)
  //         newSrcs[newFromId] = newToId
  //       })
  //       node.srcs = newSrcs
  //     }
  //     return node
  //   })
  //   return nodes
  // }
  //
  static removeNodeId(nodes:[],node_ids:[]){
    node_ids.forEach((removeId)=>{
      nodes.forEach((node)=>{
        if(node.dsts){
          Object.keys(node.dsts).forEach((from)=>{
            const to = node.dsts[from]
            if(from === removeId || to === removeId)
              delete node.dsts[from]
            })
        }
        if(node.srcs){
          Object.keys(node.srcs).forEach((from)=>{
            const to = node.srcs[from]
            if(from === removeId || to === removeId)
              delete node.srcs[from]
          })
        }
      })
    })
    return nodes
  }
  //
  // static replaceNodeId(replaceKeyPairs:{},nodeId:string):string{
  //   let newNodeId = nodeId
  //   Object.keys(replaceKeyPairs).forEach((key)=>{
  //     if(nodeId === key){
  //       newNodeId = replaceKeyPairs[key]
  //     }
  //   })
  //   return newNodeId
  // }


  /**
   * フローの保存
   * @param flowUUID
   * @param nodes
   * @param projectId
   * @param projectName
   * @returns {Promise<any>}
   */
  static saveNodes (flowUUID:string,nodes:[]):any {
    //validation
    Validator.nodesValidate(nodes)
    return new Promise((resolve, reject) => {
      HttpUtil.put("flows/" + flowUUID,{nodes:nodes}).then((response)=>{
        resolve(response)
      })
    })
  }

  /**
   * フローの保存
   * @param flowUUID
   * @param label
   * @param description
   * @param params
   * @param ports
   * @returns {Promise<any>}
   */
  static saveFlowSettings (flowUUID:string,{label,description,params,ports}):any {
    let putBody = {}
    if(label)putBody["label"]=label
    if(description)putBody["description"]=description
    if(params)putBody["params"]=params
    if(ports)putBody["ports"]=ports

    return new Promise((resolve, reject) => {
      HttpUtil.put("flows/" + flowUUID,putBody).then((response)=>{
        resolve(response)
      })
    })
  }
  static setModelType(json:{}):StepModelType {
    if (json["srcs"] !== undefined && json["dsts"] !== undefined && json["uuid"] !== undefined) return new SubFlowStepModel(json)
    if (json["srcs"] !== undefined && json["dsts"] !== undefined) return new CommandStepModel(json)
    if (json["uuid"] !== undefined && json["dataSource"] !== undefined) return new DataFrameStepModel(json)
    return json
  }

}