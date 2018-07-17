import Constants from '../constants'
import Graph,{defaultNodeProps,defaultGraphProps} from '../utils/Graph'
import StateUtil from '../utils/State'

const LOAD_FLOW_JSON_ACTION = "load_flow_json_action"
const ADD_MASTER_ACTION = "add_master_action";
const ADD_STEP_ACTION = "add_step_action";
const UPDATE_STEP_ACTION = "update_step_action";
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

const graph = new Graph()
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
  nodes:{},
  mast:{},
  selected_tab_id:0,
  drag:{},
  selected_in_edges:[],
  selected_out_edges:[]
}


const Application = (state = initialState, action) => {
    switch (action.type) {
        case LOAD_FLOW_JSON_ACTION: {
            let {context} = action
            let newState = StateUtil.deepCopy(state)

            const loadedJson = graph.load(context)

            newState = Object.assign(newState,{...loadedJson})

            newState.projectId = loadedJson.projectId
            newState.projectName = loadedJson.name

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
            let {add_step, from_step_id} = action

            let offsetX = 0
            let hasNode = (from_step_id)?(graph.outEdges(from_step_id).length):false
            if(hasNode){
                offsetX = defaultNodeProps.width + 100
            }
            //ノードの追加
            graph.addNode(add_step.id, from_step_id)
            
            //Stateの更新
            let newState = StateUtil.deepCopy(state)
            if(from_step_id){
                //連結した状態での追加
                const from_step = state.nodes[from_step_id]
                add_step.setFrame({x:from_step.position.x + offsetX, y:from_step.position.y + defaultGraphProps.rankSeparator + defaultNodeProps.height, width:defaultNodeProps.width, height:defaultNodeProps.height})
            }else{
                //単体での追加
                add_step.setFrame({x:100, y:100 + defaultGraphProps.rankSeparator + defaultNodeProps.height, width:defaultNodeProps.width, height:defaultNodeProps.height})
            }


            newState.nodes[add_step.id] = add_step

            newState.graph = graph.getGraph(newState)
            return newState
        }
        case UPDATE_STEP_ACTION: {
            //http://otiai10.hatenablog.com/entry/2016/04/20/013348
            //stateを一度ディープコピーしないとrenderされないためコピーする
            let newState = StateUtil.deepCopy(state)
            newState.nodes[action.step.id] = action.step

            //選択されているstepの値も更新する
            newState.graph = graph.getGraph(newState)
            return newState
        }
        case DELETE_STEPS_ACTION: {
            let newState = StateUtil.deepCopy(state)
            action.step_ids.map((id)=>{
              graph.removeNode(id)
              delete newState.nodes[id]
            })
            newState.graph = graph.getGraph(newState)

            //削除後は非選択状態にする
            newState.selected_step_ids = []
            return newState
        }
        case CUT_STEPS_ACTION: {
            console.log("CUT_STEPS_ACTION")
            console.log(action.step_ids)

            let newState = StateUtil.deepCopy(state)
            const cut_data = JSON.stringify({data:action.step_ids.map((id)=>{
                return newState.nodes[id]
            })})

            console.log(cut_data)

            navigator.clipboard.writeText(cut_data).then(()=> {

                action.step_ids.map((id)=>{
                    graph.removeNode(id)
                    delete newState.nodes[id]
                })
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
            let newState = StateUtil.deepCopy(state)
            let newSteps = {}
            Object.keys(newState.nodes).map((key)=>{
              if(newState.nodes[key] instanceof DataSourceModel) {
                  newState.nodes[key].property.hasData = true
                }
                newSteps[key] = newState.nodes[key]
            })
            newState.nodes = newSteps
            return newState
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
          }else if(state.zoom + offset > 70 && state.zoom + offset < 150){
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
export const addStepAction = (add_step, from_step_id) => {
  return {
    type: ADD_STEP_ACTION,
    add_step: add_step,
    from_step_id: from_step_id
  }
}

/**
 * JSONの読み込み
 * @param context
 * @returns {{type: string, context: *}}
 */
export const loadFlowJSONAction = (context) => {
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
export const addMasterAction = (context) => {
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
export const updateStepAction = step => {
  return {
    type: UPDATE_STEP_ACTION,
    step: step
  }
}

/**
 * ステップの削除
 * @param step_ids
 * @returns {{type: string, step: *}}
 */
export const deleteStepsAction = step_ids => {
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
export const cutStepsAction = step_ids => {
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
export const copyStepsAction = step_ids => {
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
export const selectStepsAction = selected_steps => {
  return {
    type: SELECT_STEPS_ACTION,
    selected_steps: selected_steps
  }
}

export const addSelectStepAction = selected_step_id => {
    return {
        type: ADD_SELECT_STEP_ACTION,
        selected_step_id: selected_step_id
    }
}

export const deleteSelectStepAction = selected_step_id => {
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
export const executeFlowAction = flowid => {
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
export const selectTabAction = (tab_id) => {
  return {
    type: SELECT_TAB_ACTION,
    selected_tab_id: tab_id
  }
}

export const dragStartAction = (x,y) => {
  return {
    type : DRAG_START_ACTION,
    x:x,
    y:y
  }
}

export const draggingAction = (x,y) => {
  return {
    type : DRAGGING_ACTION,
    x:x,
    y:y
  }
}

export const dragEndAction = (x,y) => {
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