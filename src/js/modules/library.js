//@flow
import Constants from '../constants'
import Graph, { defaultNodeProps, defaultGraphProps } from '../utils/Graph'
import StateUtil from '../utils/State'
import FlowModel from '../model/Flow/FlowModel'
import NavigationModel from '../model/Navigation/NavigationModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import CommandStepModel from '../model/Step/CommandStepModel'
import type { CommandModelType, CommandPortType, StepModelType } from '../types'
import CommandModel from '../model/Command/CommandModel'
import FlowUtil from '../utils/FlowUtil'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import { DataFrameDetailType } from '../types'
import Command from '../components/shared/Command'
import ModelUtil from '../utils/ModelUtil'
import Ajv from 'ajv'
import Validator from '../utils/Validator'
import Log from '../utils/Log'
import type { DataFrameStepModelProps } from '../model/Step/DataFrameStepModel'
import _ from 'lodash'
import ZoomUtil from '../utils/ZoomUtil'

let initialState = {
}

const LibraryReducer = (state = initialState, action: {}) => {
  //http://otiai10.hatenablog.com/entry/2016/04/20/013348
  //stateを一度ディープコピーしないとrenderされないためコピーする
  let newState = StateUtil.deepCopy(state)
  switch (action.type) {
//    case LOAD_FLOW_JSON_ACTION: {
//      let {context} = action
//      const loadedJson = graph.load(context.data)
//      newState.originalFlow = {...loadedJson}
//      newState.flow = new FlowModel(loadedJson)
//      newState.nodes = loadedJson.nodes
//      newState.project = {id: loadedJson.projectId}
//      newState.graph = graph.getGraph(newState)
//
//      newState.history.current = 0
//      newState.history.nodes = [newState.nodes]
//
//      //読み込み時に Flow、Graph、Nodesの値のバリデーションチェックを行う
//      Validator.isFlowModelSchema(newState)
//      Validator.isGraphModelSchema(newState)
//      Validator.isNodesSchema(newState)
//      Validator.nodesValidate(newState.nodes)
//      break
//    }
//
//    default:
//      window.nodes = state.nodes
//      return state
  }
//  window.nodes = newState.nodes
  return newState

}

export default LibraryReducer


///**
// * JSONの読み込み
// * @param context
// * @returns {{type: string, context: *}}
// */
//export const loadFlowJSONAction = (context: {}) => {
//  return {
//    type: LOAD_FLOW_JSON_ACTION,
//    context: context,
//  }
//}
