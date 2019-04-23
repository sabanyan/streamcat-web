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
import NoteStepModel from '../model/Step/NoteStepModel';

const LOAD_FLOW_JSON_ACTION = 'load_flow_json_action'
const ADD_MASTER_ACTION = 'add_master_action'
const ADD_STEP_ACTION = 'add_step_action'
const UPDATE_STEP_ACTION = 'update_step_action'
const UPDATE_FLOW_ACTION = 'update_flow_action'
const SELECT_STEPS_ACTION = 'select_steps_action'
const ADD_SELECT_STEP_ACTION = 'add_select_step_action'
const DELETE_SELECT_STEP_ACTION = 'delete_select_step_action'
const DELETE_STEPS_ACTION = 'delete_steps_action'
const CUT_STEPS_ACTION = 'cut_steps_action'
const COPY_STEPS_ACTION = 'copy_steps_action'
const PASTE_STEPS_ACTION = 'paste_steps_action'
const ADD_HISTORY_ACTION = 'add_history_action'
const UNDO_ACTION = 'undo_action'
const REDO_ACTION = 'redo_action'
const REFRESH_GRAPH_ACTION = 'refresh_graph_action'
const EXECUTE_FLOW_ACTION = 'execute_flow_action'
const SORT_FLOW_ACTION = 'sort_flow_action'
const SELECT_TAB_ACTION = 'select_tab_action'
const DRAG_START_ACTION = 'drag_start_action'
const DRAGGING_ACTION = 'dragging_action'
const DRAG_END_ACTION = 'drag_end_action'
const SET_ZOOM_ACTION = 'set_zoom_action'
const UPDATE_DATA_SOURCE_DETAIL_ACTION = 'update_data_source_detail_action'
const UPDATE_CACHE_ACTION = 'update_cache_action'
const graph: Graph = new Graph()

let initialState = {
  selected_step_ids: [],
  graph: graph.getGraph({}),
  zoom: 100,
  nodes: [],
  history: {
    current: 0,
    nodes: []
  },
  mast: {},
  selected_tab_id: 0,
  drag: {},
  selected_in_edges: [],
  selected_out_edges: [],
  selected_data_source_detail: {}
}

const FlowEditorReducer = (state = initialState, action: {}) => {
  //http://otiai10.hatenablog.com/entry/2016/04/20/013348
  //stateを一度ディープコピーしないとrenderされないためコピーする
  let newState = StateUtil.deepCopy(state)
  switch (action.type) {
    case LOAD_FLOW_JSON_ACTION: {
      let {context} = action
      const loadedJson = graph.load(context.data)
      newState.originalFlow = {...loadedJson}
      newState.flow = new FlowModel(loadedJson)
      newState.nodes = loadedJson.nodes
      newState.project = {id: loadedJson.projectId}
      newState.graph = graph.getGraph(newState)

      newState.history.current = 0
      newState.history.nodes = [newState.nodes]

      // newState.nodesとnewState.history.nodesの参照先が同じ場合、undoがうまくいかないため、一度ディープコピーする
      newState.history = StateUtil.deepCopy(newState.history)
      //読み込み時に Flow、Graph、Nodesの値のバリデーションチェックを行う
      Validator.isFlowModelSchema(newState)
      Validator.isGraphModelSchema(newState)
      Validator.isNodesSchema(newState)
      Validator.nodesValidate(newState.nodes)
      break
    }
    case ADD_MASTER_ACTION: {
      let {context} = action
      newState.mast = Object.assign(newState.mast, {...context})
      break
    }
    case ADD_STEP_ACTION: {
      let {add_step, src_step_ids, dst_step_ids} = action

      let offsetX = 0
      // let hasNode = (from_step_ids)?(graph.outEdges(from_step_ids[0]).length):false
      // if(hasNode){
      //     offsetX = defaultNodeProps.width + 100
      // }

      //ノードの追加
      graph.addNode(add_step.id)

      if (add_step instanceof CommandStepModel ||
        add_step instanceof SubFlowStepModel) {

        let totalSX = 0
        let totalSY = 0

        src_step_ids.forEach((id: string) => {
          const target: StepModelType = Graph.getNode(state.nodes, id)
          totalSX = totalSX + target.position.x
          totalSY = totalSY + target.position.y
        })

        //dsts
        let totalDX = 0
        dst_step_ids.forEach((id: string) => {
          //ノードの数に応じて
          totalDX = totalDX + defaultGraphProps.nodeSeparator
        })

        //
        //   ○[     ]○[     ]○
        //   ↑ノード↑nodeSeparator という配置になるため、
        //   末尾のnodeSeparatorを引いておく
        //
        if (totalDX) totalDX = totalDX - defaultGraphProps.nodeSeparator

        if (src_step_ids || dst_step_ids) {
          //追加したステップの位置調整
          let average = {
            sx: totalSX / src_step_ids.length,
            sy: totalSY / src_step_ids.length,
            dx: totalDX / 2
          }

          if(!src_step_ids.length){
            //入力がない場合、グラフの中央を基準にする
            const leftTopPosition = {
              x: document.querySelector("#flow_editor>div").scrollLeft,
              y: window.pageYOffset
            }
            average = {
              sx: ZoomUtil.zoomReverse(leftTopPosition.x + (window.innerWidth - 400) / 2,newState.zoom),
              sy:  ZoomUtil.zoomReverse(leftTopPosition.y + (window.innerHeight - 60) / 2,newState.zoom),
              dx: totalDX / 2
            }
          }

          const newPosition = {
            x: average.sx,
            y: average.sy + Constants.default.step.height + defaultGraphProps.rankSeparator
          }

          //追加されたノードの位置調整
          add_step.setFrame({
            x: newPosition.x,
            y: newPosition.y,
            width: defaultNodeProps.width,
            height: defaultNodeProps.height
          })

          //追加したノードが他のノードと位置が重複していた場合ちょっとずらす処理
          const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition({...add_step.position},newState.nodes)
          const notOverlapOffsetX = notOverlapNodePosition.x - add_step.position.x
          const notOverlapOffsetY = notOverlapNodePosition.y - add_step.position.y
          if(notOverlapOffsetX !==0 || notOverlapOffsetY !==0){
            //再調整
            add_step.setFrame({
              x: notOverlapNodePosition.x,
              y: notOverlapNodePosition.y,
              width: defaultNodeProps.width,
              height: defaultNodeProps.height
            })
          }

          //先行して設置されている接続先のノードの位置調整
          dst_step_ids.map((id, index) => {
            let new_node = Graph.getNode(state.nodes, id)
            new_node.setFrame({
              x: add_step.position.x - average.dx + index * (defaultNodeProps.width + defaultGraphProps.nodeSeparator + notOverlapOffsetX),
              y: add_step.position.y + defaultNodeProps.height + defaultGraphProps.rankSeparator,
              width: defaultNodeProps.width,
              height: defaultNodeProps.height
            })
            newState.nodes = Graph.updateNode({nodes: state.nodes, key: id, new_node: new_node})
          })
          //出力先ステップの位置調整

          //コマンドのポート名に合わせて srcs,dsts のキー値を指定する
          let command: CommandModelType
          if (add_step instanceof SubFlowStepModel) {
            command = add_step.getCommand()
          }
          else if (add_step instanceof CommandStepModel) {
            command = add_step.getCommand()
          }
          const inPorts: [CommandPortType] = command.getInPorts()
          const outPorts: [CommandPortType] = command.getOutPorts()
          src_step_ids.forEach((id, index) => {
            const newPort = inPorts[index]
            let portName = newPort.name
            if (add_step instanceof SubFlowStepModel) {
              portName = newPort.nodeId
            }
            if(portName === "*"){
              portName = "*1"
            }

            add_step.srcs[portName] = id

            //srcsがあった場合は１つ目のポート名につなぐ
            //srcsがない場合は、デフォルト値（i）のポートにつなぐ
            const from: string = id
            const to: string = add_step.id
            let inputPortName = Constants.default.command.inputPortName
            if (add_step.srcs !== undefined || add_step.srcs !== {}) {
              inputPortName = Object.keys(add_step.srcs)[0]
            }
            graph.addEdge(from, to, Graph.edgeName(from, to, portName))

          })
          dst_step_ids.forEach((id, index) => {
            const newPort = outPorts[index]
            let portName = newPort.name
            if (add_step instanceof SubFlowStepModel) {
              portName = newPort.label
            }
            add_step.dsts[portName] = id
            
            //dstsがあった場合は１つ目のポート名につなぐ
            //dstsがない場合は、デフォルト値（i）のポートにつなぐ
            const from: string = add_step.id
            const to: string = id
            let outputPortName = Constants.default.command.outputPortName
            if (add_step.dsts !== undefined || add_step.dsts !== {}) {
              outputPortName = Object.keys(add_step.dsts)[0]
            }
            graph.addEdge(from, to, Graph.edgeName(from, to, outputPortName))
          })
        } else {
          add_step.srcs = {}
          add_step.dsts = {}
          add_step.setFrame({x: 0, y: 0, width: defaultNodeProps.width, height: defaultNodeProps.height})
        }
      }

      if (add_step instanceof DataFrameStepModel) {
        add_step.setFrame({
          x: window.innerWidth / 2 - defaultNodeProps.width / 2,
          y: window.innerHeight / 2 - defaultNodeProps.height / 2,
          width: defaultNodeProps.width,
          height: defaultNodeProps.height
        })
      }
      
      newState.nodes.push(add_step)
      newState.graph = graph.getGraph(newState)
      break
    }
    case UPDATE_STEP_ACTION: {

      newState.nodes = rebuildNodesEdges(newState,action)

      //選択されているEdgeも更新する
      newState.selected_in_edges = graph.g.inEdges(state.selected_step_ids[0])
      newState.selected_out_edges = graph.g.outEdges(state.selected_step_ids[0])

      //選択されているstepの値も更新する
      newState.graph = graph.getGraph(newState)
      break
    }
    case UPDATE_FLOW_ACTION: {
      newState.flow = action.flow
      break
    }

    case DELETE_STEPS_ACTION: {
      let deleteKeySet = new Set()

      //削除対象がデータフレームの場合、srcも削除対象とする
      //ただしsrcが別のデータフレームを複数出力している場合があるので、
      //一つでもデータフレームが残っていると削除は行わない
      action.step_ids.forEach((id) => {
        if (Graph.getNode(newState.nodes, id) instanceof DataFrameStepModel) {
          //削除対象のノードの親がある場合、親を調べる
          if (graph.g.inEdges(id) && graph.g.inEdges(id).length > 0) {
            const deleteTargetStepId = graph.g.inEdges(id)[0].v
            const deleteTargetStep = Graph.getNode(newState.nodes, deleteTargetStepId)
            if (deleteTargetStep instanceof CommandStepModel ||
              deleteTargetStep instanceof SubFlowStepModel) {
              //親のコマンドの出力先が対象のデータフレームだけの場合親を削除
              const isSingleDsts = (Object.keys(deleteTargetStep.dsts).length === 1 && deleteTargetStep.dsts[Object.keys(deleteTargetStep.dsts)[0]] === id)
              if (isSingleDsts) {
                //親を削除
                newState.nodes = graph.removeNode(newState.nodes, deleteTargetStepId)
                deleteKeySet.add(deleteTargetStepId)
              }
            }
          }
        }
        //選択されたノードを削除
        newState.nodes = graph.removeNode(newState.nodes, id)
        deleteKeySet.add(id)
      })

      newState.nodes = Graph.getNewNodesWithExculudeKeys(newState.nodes, deleteKeySet)
      newState.graph = graph.getGraph(newState)

      //削除後は非選択状態にする
      newState.selected_step_ids = []
      break
    }
    // case CUT_STEPS_ACTION: {
    //   let newState = StateUtil.deepCopy(state)
    //   let deleteKeySet = new Set()
    //   action.step_ids.forEach((id:string)=>{
    //     newState.nodes = graph.removeNode(newState.nodes,[id])
    //     deleteKeySet.add(id)
    //   })
    //   newState.nodes = Graph.getNewNodesWithExculudeKeys(newState.nodes,deleteKeySet)
    //   newState.graph = graph.getGraph(newState)
    //
    //   //削除後は非選択状態にする
    //   newState.selected_step_ids = []
    //
    //   return newState
    // }
     case PASTE_STEPS_ACTION:
     {
       let newState = StateUtil.deepCopy(state)

       const add_nodes = JSON.parse(action.paste_nodes)

       //ペースト時に
       //IDが新規に振られるので、旧のIDを新規のIDに置き換え
       //コマンドのノード間の関連(srcs,dsts)を維持する
       //let convertMap = {}
       add_nodes.forEach((json)=>{
         const cacheId = json.id
         let label = (json.label)?json.label:cacheId
         json.id = null
         json.label = "コピー " + label
         let newNode:StepModelType = FlowUtil.setModelType(json)

         //ノード本体をコピー
         graph.addNode(newNode.id)

         //入力値をコピー
         newNode = FlowUtil.copySrcs(newNode)
         newNode = FlowUtil.copyPositionWithOffsetX(newNode)
         let newDsts = {}
         Object.keys(newNode.dsts).forEach((key)=>{
           //出力先を作成し、接続先を変更する
           const copiedStep:DataFrameStepModel = FlowUtil.getNodeFromID(newState.nodes,newNode.dsts[key])
           const props:DataFrameStepModelProps = {
             id: null,
             type: Constants.step.type.frame,
             uuid: null,
             label: "コピー " + copiedStep.getLabel(),
             dataSource: copiedStep.dataSource,
             // srcs: newNode.id,
             // dsts: [],
             position: copiedStep.position
           }
           let add_step = new DataFrameStepModel(props)
           add_step = FlowUtil.copyPositionWithOffsetX(add_step)
           newState.nodes.push(add_step)
           //ノード本体をコピー
           graph.addNode(add_step.id)
           newDsts[key] = add_step.id
         })
         //convertMap[cacheId] = newNode.id
         newNode.dsts = {}
         newState.nodes.push(newNode)

         const action_step = _.cloneDeep(newNode)
         action_step.dsts = newDsts
         newState.nodes = rebuildNodesEdges(newState,{step:action_step})

       })
       //newState.nodes = FlowUtil.replaceNodeIds(convertMap,newState.nodes)

       newState.graph = graph.getGraph(newState)

       window.nodes = newState.nodes
       return newState
     }
    case ADD_HISTORY_ACTION:{
      //let newState = StateUtil.deepCopy(state)
      const isSame = FlowUtil.isSameCurrentNodesToBeforeHistoryNodes(newState.history,newState.nodes)
      
      if(isSame){
        return newState
      }
      
      if(newState.history.current != newState.history.nodes.length - 1){
        //前に戻っている状態で履歴が追加された場合は、
        //current以降の履歴は消す
        newState.history.nodes = newState.history.nodes.slice(0,newState.history.current + 1)
        newState.history.nodes.push(newState.nodes)
        newState.history.current = newState.history.nodes.length - 1
      }else{
        newState.history.nodes.push(newState.nodes)
        newState.history.current = newState.history.nodes.length - 1
      }

      return newState
    }
    case UNDO_ACTION:{
      let newState = StateUtil.deepCopy(state)    
      if(newState.history.current > 0){
        //一つ前に巻き戻し
        newState.history.current = newState.history.current - 1
        newState.nodes = state.history.nodes[newState.history.current]
        allRebuildNodesEdges(newState)
        window.nodes = newState.nodes
        newState.graph = graph.getGraph(newState)
      }
      return newState
    }
    case REDO_ACTION:{
      let newState = StateUtil.deepCopy(state)
      const max = newState.history.nodes.length
      if(newState.history.current < max){
        //一つ前に巻き戻し
        newState.history.current = newState.history.current + 1
        newState.nodes = state.history.nodes[newState.history.current]
        allRebuildNodesEdges(newState)
        window.nodes = newState.nodes
        newState.graph = graph.getGraph(newState)
      }
      return newState
    }
    case SELECT_STEPS_ACTION: {
      if (action.selected_steps && action.selected_steps.length === 1) {
        newState.selected_step_ids = action.selected_steps.map((step) => step.id)
        const selected_id = action.selected_steps[0].id
        newState.selected_in_edges = graph.g.inEdges(selected_id)
        newState.selected_out_edges = graph.g.outEdges(selected_id)
      } else {
        newState.selected_step_ids = []
        newState.selected_in_edges = []
        newState.selected_out_edges = []
      }
      break
    }
    case ADD_SELECT_STEP_ACTION: {
      if (action.selected_step_id) {
        let new_selected_step_ids = newState.selected_step_ids
        new_selected_step_ids.push(action.selected_step_id)
        newState.selected_step_ids = [...new Set(new_selected_step_ids)]
        return newState
      }
      break
    }

    case DELETE_SELECT_STEP_ACTION: {
      if (action.selected_step_id) {
        newState.selected_step_ids = newState.selected_step_ids.filter((id) => {
          if (id === action.selected_step_id) {
            return false
          }
          return true
        })
        return newState
      }
      break
    }

    case SORT_FLOW_ACTION: {
      // memoはソート対象外にする
      let targets = newState.nodes.filter((node) => {
        return !(node instanceof NoteStepModel)
      })
      graph.refreshPosition(targets) //ノード位置を再計算
      newState.graph = graph.getGraph(newState)
      break
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
    }
    case SELECT_TAB_ACTION: {
      newState = {
        ...state,
        selected_tab_id: action.selected_tab_id
      }
      break
    }
    case DRAG_START_ACTION: {
      newState = {
        ...state,
        drag: {
          start: {
            x: action.x,
            y: action.y,
          },
          end: {
            x: action.x,
            y: action.y,
          }
        },
        graph: {
          ...state.graph,
          width: (action.x > state.graph.width) ? action.x : state.graph.width,
          height: (action.y > state.graph.height) ? action.y : state.graph.height
        }
      }
      break
    }
    case DRAGGING_ACTION: {
      newState = {
        ...state,
        drag: {
          ...state.drag,
          end: {
            x: action.x,
            y: action.y,
          }
        },
        graph: {
          ...state.graph,
          width: (action.x > state.graph.width) ? action.x : state.graph.width,
          height: (action.y > state.graph.height) ? action.y : state.graph.height
        }
      }
      break
    }
    case DRAG_END_ACTION: {
      newState = {...state, drag: {}}
      break
    }

    case SET_ZOOM_ACTION: {
      const {offset, value} = action
      if (offset === undefined) {
        //絶対値
        newState = {...state, zoom: value}
      } else if (state.zoom + offset >= 40 && state.zoom + offset <= 180) {
        //差分
        newState = {...state, zoom: state.zoom + offset}
      }
      newState.graph = graph.getGraph(newState)
      break
    }

    case UPDATE_DATA_SOURCE_DETAIL_ACTION: {
      newState.selected_data_source_detail = action.detail
      break
    }

    case UPDATE_CACHE_ACTION: {
      const updatedStep = action.step
      newState.nodes = newState.nodes.map((node, index) => {
        if(node.id == updatedStep.id) {
          node.cacheCreatedAt = updatedStep.cacheCreatedAt
          node.uuid = updatedStep.uuid
          node.makeCache = updatedStep.makeCache
        }
        return node
      })
    }
    
    default:
      window.nodes = state.nodes
      return state
  }
  window.nodes = newState.nodes
  return newState

}

export default FlowEditorReducer

/**
 * エッジのつなぎ直し処理
 * @param newState
 * @param action action.stepに変更後のコマンドステップ or サブフローステップを設定する
 * @returns {*}
 */
function rebuildNodesEdges(newState,action){
  return newState.nodes.map((node, index) => {
    //入力選択機能やクリップボードのコピーによって再度 結びつきが変更された場合のエッジのつなぎ直し対応
    if (node.id === action.step.id) {
      if (node instanceof CommandStepModel ||
        node instanceof SubFlowStepModel) {
        if (!_.isEqual(node.srcs,action.step.srcs)) {
          //ノードのつながりを削除
          Object.keys(node.srcs).forEach(portName => {
            const id = node.srcs[portName]
            const from = id
            const to = node.id
            if (Graph.getNode(newState.nodes, id)) {
              graph.removeEdge(from, to, Graph.edgeName(from, to, portName))
            }
          })
          //ノードのつながりを再構築
          Object.keys(action.step.srcs).forEach(portName => {
            const id = action.step.srcs[portName]
            const from = id
            const to = action.step.id
            if (Graph.getNode(newState.nodes, id)) {
              graph.addEdge(from, to, Graph.edgeName(from, to, portName))
            }
          })
        }
        if (!_.isEqual(node.dsts,action.step.dsts)) {
          //ノードのつながりを削除
          Object.keys(node.dsts).forEach(portName => {
            const id = node.dsts[portName]
            const from = node.id
            const to = id
            if (Graph.getNode(newState.nodes, id)) {
              graph.removeEdge(from, to, Graph.edgeName(from, to, portName))
            }
          })
          //ノードのつながりを再構築
          Object.keys(action.step.dsts).forEach(portName => {
            const id = action.step.dsts[portName]
            const from = action.step.id
            const to = id
            if (Graph.getNode(newState.nodes, id)) {
              graph.addEdge(from, to, Graph.edgeName(from, to, portName))
            }
          })
        }
      }
      return action.step
    }
    return node
  })
}

/**
 * エッジのつなぎ直し処理
 * @param newState
 * @param action action.stepに変更後のコマンドステップ or サブフローステップを設定する
 * @returns {*}
 */
function allRebuildNodesEdges(newState){
  graph.removeAllEdges(newState.graph.edges)
  return newState.nodes.map((node, index) => {
    //入力選択機能やクリップボードのコピーによって再度 結びつきが変更された場合のエッジのつなぎ直し対応
      if (node instanceof CommandStepModel ||
        node instanceof SubFlowStepModel) {
        //ノードのつながりを再構築
        Object.keys(node.srcs).forEach(portName => {
          const id = node.srcs[portName]
          const from = id
          const to = node.id
          if (Graph.getNode(newState.nodes, id)) {
            graph.addEdge(from, to, Graph.edgeName(from, to, portName))
          }
        })
        //ノードのつながりを再構築
        Object.keys(node.dsts).forEach(portName => {
          const id = node.dsts[portName]
          const from = node.id
          const to = id
          if (Graph.getNode(newState.nodes, id)) {
            graph.addEdge(from, to, Graph.edgeName(from, to, portName))
          }
        })
      }
      return node
  })
}

/**
 * ステップの追加
 * @param step
 * @returns {{type: string, step: *}}
 */
export const addStepAction = (add_step: StepModelType, src_step_ids: [] = [], dst_step_ids: [] = []) => {
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
export const loadFlowJSONAction = (context: {}) => {
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
export const addMasterAction = (context: {}) => {
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
export const updateStepAction = (step: StepModelType) => {
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
export const deleteStepsAction = (step_ids: []) => {
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
export const cutStepsAction = (step_ids: []) => {
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
export const copyStepsAction = (step_ids: []) => {
  return {
    type: COPY_STEPS_ACTION,
    step_ids: step_ids
  }
}
/**
 * ステップのペースト
 * @returns {{type: string, step: *}}
 */
export const pasteStepsAction = (paste_nodes: []) => {
  return {
    type: PASTE_STEPS_ACTION,
    paste_nodes: paste_nodes
  }
}
/**
 * 履歴の追加
 * @returns {{type: string, step: *}}
 */
export const addHistoryAction = () => {
  return {
    type: ADD_HISTORY_ACTION,
  }
}
/**
 * アンドゥ
 * @returns {{type: string, step: *}}
 */
export const undoAction = () => {
  return {
    type: UNDO_ACTION,
  }
}
/**
 * リドゥ
 * @returns {{type: string, step: *}}
 */
export const redoAction = () => {
    return {
      type: REDO_ACTION,
    }
  }
/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
export const selectStepsAction = (selected_steps: []) => {
  return {
    type: SELECT_STEPS_ACTION,
    selected_steps: selected_steps
  }
}

export const addSelectStepAction = (selected_step_id: string) => {
  return {
    type: ADD_SELECT_STEP_ACTION,
    selected_step_id: selected_step_id
  }
}

export const deleteSelectStepAction = (selected_step_id: string) => {
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
export const executeFlowAction = (flowid: string) => {
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
export const selectTabAction = (tab_id: string) => {
  return {
    type: SELECT_TAB_ACTION,
    selected_tab_id: tab_id
  }
}

export const dragStartAction = (x: number, y: number) => {
  return {
    type: DRAG_START_ACTION,
    x: x,
    y: y
  }
}

export const draggingAction = (x: number, y: number) => {
  return {
    type: DRAGGING_ACTION,
    x: x,
    y: y
  }
}

export const dragEndAction = (x: number, y: number) => {
  return {
    type: DRAG_END_ACTION,
    x: x,
    y: y
  }
}

/**
 * ズーム設定
 * @param offset 差分
 * @param value 固定値
 * @returns {{type: string, offset: *, value: *}}
 * @constructor
 */
export const setZoomAction = ({offset, value}) => {
  return {
    type: SET_ZOOM_ACTION,
    offset: offset,
    value: value
  }
}

/**
 * データフレームの詳細更新
 * @param dataFrame
 * @returns {{dataFrame: DataFrameStepModel, type: string}}
 */
export const updateDataFrameDetailAction = (detail: DataFrameDetailType) => {
  return {
    detail: detail,
    type: UPDATE_DATA_SOURCE_DETAIL_ACTION
  }
}

export const updateCacheAction = (step: StepModelType) => {
  return {
    type: UPDATE_CACHE_ACTION,
    step: step
  }
}