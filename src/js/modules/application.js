//@flow
import Constants from '../constants'
import Graph,{defaultNodeProps,defaultGraphProps} from '../utils/Graph'
import StateUtil from '../utils/State'
import FlowModel from '../model/Flow/FlowModel'
import NavigationModel from '../model/Navigation/NavigationModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'
import CommandStepModel from '../model/Step/CommandStepModel'
import type { CommandPortType, StepModelType } from '../types'
import CommandModel from '../model/Command/CommandModel'
import FlowUtil from '../utils/FlowUtil'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'

const LOAD_FLOW_JSON_ACTION = "load_flow_json_action"
const ADD_MASTER_ACTION = "add_master_action";
const ADD_STEP_ACTION = "add_step_action";
const UPDATE_STEP_ACTION = "update_step_action";
const UPDATE_FLOW_ACTION = "update_flow_action";
const SELECT_STEPS_ACTION = "select_steps_action";
const ADD_SELECT_STEP_ACTION = "add_select_step_action"
const DELETE_SELECT_STEP_ACTION = "delete_select_step_action"
const DELETE_STEPS_ACTION = "delete_steps_action";
const CUT_STEPS_ACTION = "cut_steps_action";
const COPY_STEPS_ACTION = "copy_steps_action";
const PASTE_STEPS_ACTION = "paste_steps_action";
const REFRESH_GRAPH_ACTION = "refresh_graph_action";
const EXECUTE_FLOW_ACTION = "execute_flow_action";
const SORT_FLOW_ACTION = "sort_flow_action";
const SELECT_TAB_ACTION = "select_tab_action";
const DRAG_START_ACTION = "drag_start_action";
const DRAGGING_ACTION = "dragging_action";
const DRAG_END_ACTION = "drag_end_action";
const SET_ZOOM_ACTION = "set_zoom_action";
const UPDATE_DATAFRAME_DETAIL_ACTION = "update_dataframe_detail_action";

const graph:Graph = new Graph()
//
// const json = {
//     "flows": [
//         "s1",
//         "s2",
//         "s3"
//     ],
//     "edges": [
//         {
//             "v": "s1",
//             "w": "s2"
//         },
//         {
//             "v": "s2",
//             "w": "s3"
//         }
//     ],
//     "steps": {
//         "s1": {
//             "id": "s1",
//             "type": "csv",
//             "text": "test-data",
//             "property": {
//                 "overview": {
//                     "count": "100",
//                     "created_at": "",
//                     "created_user_name": "山田 太郎"
//                 }
//             }
//         },
//         "s2": {
//             "id": "s2",
//             "type": "sort",
//             "text": "ソート"
//         },
//         "s3": {
//             "id": "s3",
//             "type": "csv",
//             "text": "sorted-test-data",
//             "property": {
//                 "overview": {
//                     "count": "100",
//                     "created_at": "Wed Feb 07 2018 11:22:18 GMT+0900 (JST)",
//                     "created_user_name": "あいうえお"
//                 }
//             }
//         }
//     }
// }

// initialState = (typeof inject_initial_flow_data === 'undefined')?{}:graph.load(inject_initial_flow_data)
let initialState = {
  selected_step_ids:[],
  graph:graph.getGraph({}),
  zoom: 100,
  nodes:[],
  mast:{},
  selected_tab_id:0,
  drag:{},
  selected_in_edges:[],
  selected_out_edges:[],
}


const Application = (state = initialState, action:{}) => {
    switch (action.type) {
        case LOAD_FLOW_JSON_ACTION: {
            let {context} = action
            let newState = StateUtil.deepCopy(state)

            const loadedJson = graph.load(context.data)
            newState.originalFlow = {...loadedJson}
            newState.flow = new FlowModel(loadedJson)
            newState.nodes = loadedJson.nodes
            newState.project = {id:loadedJson.projectId}

            newState.graph = graph.getGraph(newState)

            return newState
        }
        case ADD_MASTER_ACTION: {
            let {context} = action
            let newState = StateUtil.deepCopy(state)
            newState.mast = Object.assign(newState.mast,{...context})
            return newState
        }

        case ADD_STEP_ACTION: {
            let {add_step, src_step_ids,dst_step_ids} = action

            let offsetX = 0
            // let hasNode = (from_step_ids)?(graph.outEdges(from_step_ids[0]).length):false
            // if(hasNode){
            //     offsetX = defaultNodeProps.width + 100
            // }

            //ノードの追加
            graph.addNode(add_step.id)
            //Stateの更新
            let newState = StateUtil.deepCopy(state)

            if(add_step instanceof CommandStepModel ||
              add_step instanceof SubFlowStepModel){
              //srcs
              let totalSX = 0
              let totalSY = 0
              src_step_ids.forEach((id:string)=>{
                const from:string = id
                const to:string = add_step.id

                const target:StepModelType = Graph.getNode(state.nodes,id)
                totalSX = totalSX + target.position.x
                totalSY = totalSY + target.position.y
                graph.addEdge(from,to,from)
              })

              //dsts
              let totalDX = 0
              dst_step_ids.forEach((id:string)=>{
                const from:string = add_step.id
                const to:string = id
                //ノードの数に応じて
                totalDX = totalDX + defaultGraphProps.nodeSeparator
                graph.addEdge(from,to,to)
              })

              //
              //   ○[     ]○[     ]○
              //   ↑ノード↑nodeSeparator という配置になるため、
              //   末尾のnodeSeparatorを引いておく
              //
              if(totalDX)totalDX = totalDX - defaultGraphProps.nodeSeparator

              if(src_step_ids || dst_step_ids){
                  //追加したステップの位置調整
                  const average = {
                    sx: totalSX / src_step_ids.length,
                    sy: totalSY / src_step_ids.length,
                    dx: totalDX / 2
                  }

                  const newPosition = {
                    x: average.sx,
                    y: average.sy + Constants.default.step.height + defaultGraphProps.rankSeparator
                  }

                  //追加されたノードの位置調整
                  add_step.setFrame({x:newPosition.x,y:newPosition.y, width:defaultNodeProps.width, height:defaultNodeProps.height})

                  //先行して設置されている接続先のノードの位置調整
                  dst_step_ids.map((id,index)=>{
                    let new_node = Graph.getNode(state.nodes,id)
                    new_node.setFrame({
                      x: add_step.position.x - average.dx + index * (defaultNodeProps.width + defaultGraphProps.nodeSeparator),
                      y: add_step.position.y + defaultNodeProps.height + defaultGraphProps.rankSeparator,
                      width: defaultNodeProps.width,
                      height: defaultNodeProps.height
                    })
                    newState.nodes = Graph.updateNode({nodes: state.nodes, key: id, new_node: new_node})
                  })
                  //出力先ステップの位置調整

                  //コマンドのポート名に合わせて srcs,dsts のキー値を指定する
                  const command:CommandModel = add_step.getCommand(newState.mast.commands)
                  const inPorts:[CommandPortType] = command.getInPorts()
                  const outPorts:[CommandPortType] = command.getOutPorts()
                  src_step_ids.forEach((id,index)=>{
                    const newPortName = inPorts[index]
                    add_step.srcs[newPortName.name]=id
                  })
                  dst_step_ids.forEach((id,index)=>{
                    const newPortName = outPorts[index]
                    add_step.dsts[newPortName.name]=id
                  })
              }else{
                add_step.srcs = {}
                add_step.dsts = {}
                add_step.setFrame({x:0,y:0, width:defaultNodeProps.width, height:defaultNodeProps.height})
              }
            }

            if(add_step instanceof DataFrameStepModel){
              add_step.setFrame({x:window.innerWidth / 2 - defaultNodeProps.width/2,y:window.innerHeight / 2 -defaultNodeProps.height/2,width:defaultNodeProps.width,height:defaultNodeProps.height})
          }

            newState.nodes.push(add_step)
            newState.graph = graph.getGraph(newState)
            return newState
        }
        case UPDATE_STEP_ACTION: {
            //http://otiai10.hatenablog.com/entry/2016/04/20/013348
            //stateを一度ディープコピーしないとrenderされないためコピーする
            let newState = StateUtil.deepCopy(state)

            newState.nodes = newState.nodes.map((node,index)=>{

                //データに応じたノード間の繋がりの更新
                if(node.id === action.step.id){
                  if(node instanceof CommandStepModel ||
                    node instanceof SubFlowStepModel){
                    if(node.srcs !== action.step.srcs){
                      //ノードのつながりをすべて削除
                      Object.keys(node.srcs).forEach(portName=>{
                        const id = node.srcs[portName]
                        const from = id
                        const to = node.id
                        graph.removeEdge(from,to,from)
                      })
                      //ノードのつながりを再構築
                      Object.keys(action.step.srcs).forEach(portName=>{
                        const id = action.step.srcs[portName]
                        const from = id
                        const to = action.step.id
                        graph.addEdge(from,to,from)
                      })
                    }
                  }
                  return action.step
                }
              return node
            })

            //選択されているEdgeも更新する
            newState.selected_in_edges = graph.g.inEdges(state.selected_step_ids[0])
            newState.selected_out_edges = graph.g.outEdges(state.selected_step_ids[0])

            //選択されているstepの値も更新する
            newState.graph = graph.getGraph(newState)
            return newState
        }
        case UPDATE_FLOW_ACTION:{
          let newState = StateUtil.deepCopy(state)
          return {...newState,...action.flow}
        }

        case DELETE_STEPS_ACTION: {
            let newState = StateUtil.deepCopy(state)
            let deleteKeySet = new Set()
            action.step_ids.map((id)=>{
              graph.removeNode(id)
              deleteKeySet.add(id)
            })

            newState.nodes = Graph.getNewNodesWithExculudeKeys(newState.nodes,deleteKeySet)
            newState.graph = graph.getGraph(newState)

            //削除後は非選択状態にする
            newState.selected_step_ids = []
            return newState
        }
        case CUT_STEPS_ACTION: {
            let newState = StateUtil.deepCopy(state)
            const cut_data = JSON.stringify({data:action.step_ids.map((id)=>{
                return newState.nodes[id]
            })})

            navigator.clipboard.writeText(cut_data).then(()=> {

                let deleteKeySet = new Set()
                action.step_ids.map((id:string)=>{
                    graph.removeNode(id)
                    deleteKeySet.add(id)
                })
                newState.nodes = Graph.getNewNodesWithExculudeKeys(newState.nodes,deleteKeySet)
                newState.graph = graph.getGraph(newState)

                //削除後は非選択状態にする
                newState.selected_step_ids = []

            }, (err)=> {
                alert("クリップボードが利用できません")

            });

            return newState
        }
        case SELECT_STEPS_ACTION: {
            let newState = StateUtil.deepCopy(state)
            if (action.selected_steps && action.selected_steps.length === 1) {
                newState.selected_step_ids = action.selected_steps.map((step)=> step.id)
                const selected_id = action.selected_steps[0].id
                newState.selected_in_edges = graph.g.inEdges(selected_id)
                newState.selected_out_edges = graph.g.outEdges(selected_id)
            } else {
                newState.selected_step_ids = []
                newState.selected_in_edges = []
                newState.selected_out_edges = []
            }
            return newState
        }
        case ADD_SELECT_STEP_ACTION: {
            let newState = StateUtil.deepCopy(state)
            if (action.selected_step_id) {
                let new_selected_step_ids = newState.selected_step_ids
                new_selected_step_ids.push(action.selected_step_id)
                newState.selected_step_ids = [...new Set(new_selected_step_ids)]
                return newState
            }
            return state
        }

        case DELETE_SELECT_STEP_ACTION: {
            let newState = StateUtil.deepCopy(state)
            if (action.selected_step_id) {
                newState.selected_step_ids = newState.selected_step_ids.filter((id)=>{
                    if(id === action.selected_step_id){
                        return false
                    }
                    return true
                })
                return newState
            }
            return state
        }

        case SORT_FLOW_ACTION: {
            let newState = StateUtil.deepCopy(state)
            graph.refreshPosition(newState.nodes) //ノード位置を再計算
            newState.graph = graph.getGraph(newState)
            return newState
        }
        case EXECUTE_FLOW_ACTION: {
            // let newState = StateUtil.deepCopy(state)
            // let newSteps = {}
            // Object.keys(newState.nodes).map((key)=>{
            //   if(newState.nodes[key] instanceof DataSourceModel) {
            //       newState.nodes[key].property.hasData = true
            //     }
            //     newSteps[key] = newState.nodes[key]
            // })
            // newState.nodes = newSteps
            // return newState
            return state
        }
        case SELECT_TAB_ACTION:{
          return {
            ...state,
            selected_tab_id:action.selected_tab_id
          }
        }
        case DRAG_START_ACTION:{
          return {
            ...state,
            drag:{
              start:{
                x:action.x,
                y:action.y,
              },
              end:{
                x:action.x,
                y:action.y,
              }
            },
            graph:{
              ...state.graph,
              width: (action.x > state.graph.width)?action.x:state.graph.width,
              height: (action.y > state.graph.height)?action.y:state.graph.height
            }
          }
        }
        case DRAGGING_ACTION:{
          return {
            ...state,
            drag:{
              ...state.drag,
              end:{
                x:action.x,
                y:action.y,
              }
            },
            graph:{
              ...state.graph,
              width: (action.x > state.graph.width)?action.x:state.graph.width,
              height: (action.y > state.graph.height)?action.y:state.graph.height
            }
          }
        }
        case DRAG_END_ACTION:{
          return {...state,drag:{}}
        }

        case SET_ZOOM_ACTION:{
          const {offset,value} = action
          let newState = state
          if(offset === undefined){
            //絶対値
            newState = {...state,zoom:value}
          }else if(state.zoom + offset >= 80 && state.zoom + offset <= 180){
            //差分
            newState = {...state,zoom:state.zoom + offset}
          }
          newState.graph = graph.getGraph(newState)
          return newState
        }

      default:
            return state
    }

}

export default Application

/**
 * ステップの追加
 * @param step
 * @returns {{type: string, step: *}}
 */
export const addStepAction = (add_step:StepModelType, src_step_ids:[] = [],dst_step_ids:[] = []) => {
  return {
    type: ADD_STEP_ACTION,
    add_step: add_step,
    src_step_ids: src_step_ids,
    dst_step_ids: dst_step_ids
  }
}

/**
 * JSONの読み込み
 * @param context
 * @returns {{type: string, context: *}}
 */
export const loadFlowJSONAction = (context:{}) => {
  return {
    type: LOAD_FLOW_JSON_ACTION,
    context: context,
  }
}

/**
 * コマンド一覧などマスターの読み込み
 * @param context
 * @returns {{type: string, context: *}}
 */
export const addMasterAction = (context:{}) => {
  return {
    type: ADD_MASTER_ACTION,
    context: context,
  }
}



/**
 * ステップの更新
 * @param step
 * @returns {{type: string, step: *}}
 */
export const updateStepAction = (step:StepModelType) => {
  return {
    type: UPDATE_STEP_ACTION,
    step: step
  }
}

/**
 * フローの更新
 * @param step
 * @returns {{type: string, step: *}}
 */
export const updateFlowAction = flow => {
  return {
    type: UPDATE_FLOW_ACTION,
    flow: flow
  }
}

/**
 * ステップの削除
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const deleteStepsAction = (step_ids:[]) => {
  return {
      type: DELETE_STEPS_ACTION,
      step_ids: step_ids
  }
}

/**
 * ステップのカット
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const cutStepsAction = (step_ids:[])=> {
    return {
        type: CUT_STEPS_ACTION,
        step_ids: step_ids
    }
}
/**
 * ステップのコピー
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const copyStepsAction = (step_ids:[])=> {
    return {
        type: COPY_STEPS_ACTION,
        step_ids: step_ids
    }
}
/**
 * ステップのペースト
 * @returns {{type: string, step: *}}
 */
export const pasteStepsAction = () => {
    return {
        type: PASTE_STEPS_ACTION
    }
}


/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
export const selectStepsAction = (selected_steps:[]) => {
  return {
    type: SELECT_STEPS_ACTION,
    selected_steps: selected_steps
  }
}

export const addSelectStepAction = (selected_step_id:string) => {
    return {
        type: ADD_SELECT_STEP_ACTION,
        selected_step_id: selected_step_id
    }
}

export const deleteSelectStepAction = (selected_step_id:string) => {
    return {
        type: DELETE_SELECT_STEP_ACTION,
        selected_step_id: selected_step_id
    }
}

/**
 * フローの実行
 * @param flowid
 * @returns {{type: string, step: *}}
 */
export const executeFlowAction = (flowid:string) => {
  return {
    type: EXECUTE_FLOW_ACTION
  }
}

/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
export const sortFlowAction = () => {
  return {
    type: SORT_FLOW_ACTION,
  }
}

/**
 * タブの選択
 * @param
 * @returns {{type: string, selected_steps: *}}
 */
export const selectTabAction = (tab_id:string) => {
  return {
    type: SELECT_TAB_ACTION,
    selected_tab_id: tab_id
  }
}

export const dragStartAction = (x:number,y:number) => {
  return {
    type : DRAG_START_ACTION,
    x:x,
    y:y
  }
}

export const draggingAction = (x:number,y:number) => {
  return {
    type : DRAGGING_ACTION,
    x:x,
    y:y
  }
}

export const dragEndAction = (x:number,y:number) => {
  return {
    type : DRAG_END_ACTION,
    x:x,
    y:y
  }
}

/**
 * ズーム設定
 * @param offset 差分
 * @param value 固定値
 * @returns {{type: string, offset: *, value: *}}
 * @constructor
 */
export const setZoomAction = ({offset,value}) => {
  return {
    type : SET_ZOOM_ACTION,
    offset: offset,
    value: value
  }
}

/**
 * データフレームの詳細更新
 * @param dataFrame
 * @returns {{dataFrame: DataFrameStepModel, type: string}}
 */
export const updateDataFrameDetailAction = (dataFrame:DataFrameStepModel) => {
  return {
    dataFrame: dataFrame,
    type: UPDATE_DATAFRAME_DETAIL_ACTION
  }
}
