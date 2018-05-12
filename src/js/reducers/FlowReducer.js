import Constants from '../constants'
import Graph,{defaultNodeProps,defaultGraphProps} from '../utils/Graph'
import StateUtil from '../utils/State'
import DataSourceModel from '../model/DataSourceModel'

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

let initialState
initialState = (typeof inject_initial_flow_data === 'undefined')?{}:graph.load(inject_initial_flow_data)
initialState.selected_step_ids = []
initialState.graph = graph.getGraphSize(initialState.steps)
initialState.mast = {}
const FlowReducer = (state = initialState, action) => {
    switch (action.type) {
        case Constants.action.ADD_MASTER_ACTION: {
            let {context} = action
            let newState = StateUtil.deepCopy(state)
            newState.mast = Object.assign(newState.mast,{...context})
            return newState
        }
        case Constants.action.ADD_STEP_ACTION: {
            let {add_step, from_step_id} = action

            let offsetX = 0
            let hasNode = (graph.outEdges(from_step_id).length)
            if(hasNode){
                offsetX = defaultNodeProps.width + 100
            }
            //ノードの追加
            graph.addNode(add_step.id, from_step_id)


            //Stateの更新
            let newState = StateUtil.deepCopy(state)
            const from_step = state.steps[from_step_id]

            add_step.setFrame(from_step.position.x + offsetX, from_step.position.y + defaultGraphProps.rankSeparator + defaultNodeProps.height, defaultNodeProps.width, defaultNodeProps.height)
            newState.steps[add_step.id] = add_step

            newState.flows = graph.g.nodes()
            newState.edges = graph.g.edges()
            newState.graph = graph.getGraphSize(newState.steps)
            return newState
        }
        case Constants.action.UPDATE_STEP_ACTION: {
            //http://otiai10.hatenablog.com/entry/2016/04/20/013348
            //stateを一度ディープコピーしないとrenderされないためコピーする
            let newState = StateUtil.deepCopy(state)
            newState.steps[action.step.id] = action.step

            //選択されているstepの値も更新する
            newState.graph = graph.getGraphSize(newState.steps)
            return newState
        }
        case Constants.action.DELETE_STEP_ACTION: {
            let newState = StateUtil.deepCopy(state)
            graph.removeNode(action.step.id)
            delete newState.steps[action.step.id]
            newState.flows = graph.g.nodes()
            newState.edges = graph.g.edges()
            newState.graph = graph.getGraphSize(newState.steps)

            //削除後は非選択状態にする
            newState.selected_step_ids = []
            return newState
        }
        case Constants.action.SELECT_STEPS_ACTION: {
            let newState = StateUtil.deepCopy(state)
            if (action.selected_steps) {
                newState.selected_step_ids = action.selected_steps.map((step)=> step.id)
            } else {
                newState.selected_step_ids = []
            }
            return newState
        }
        case Constants.action.SORT_FLOW_ACTION: {
            let newState = StateUtil.deepCopy(state)
            newState.steps = graph.refreshPosition(newState.steps) //ノード位置を再計算
            newState.graph = graph.getGraphSize(newState.steps)
            return newState
        }
        case Constants.action.EXECUTE_FLOW_ACTION: {
            let newState = StateUtil.deepCopy(state)
            let newSteps = {}
            Object.keys(newState.steps).map((key)=>{
                if(newState.steps[key] instanceof DataSourceModel) {
                  newState.steps[key].property.hasData = true
                }
                newSteps[key] = newState.steps[key]
            })
            newState.steps = newSteps
            return newState
        }
        default:
            return state
    }

}

export default FlowReducer