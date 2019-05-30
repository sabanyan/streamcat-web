//@flow
import StateUtil from '../utils/State'

let initialState = {}

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
