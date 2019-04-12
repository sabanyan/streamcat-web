//@flow
import StateUtil from '../utils/State'
import _ from 'lodash'

const SELECT_FLOW_ACTION = 'select_flow_action'
const UPDATE_RUN_ARGS_ACTION = 'update_run_args_action'

let initialState = {
    flow : null,
    runArgs : {
        flow_uuid : null,
        flows : [],
        variables : []
    }
}

const flowList = (state = initialState, action: {}) => {
    let newState = StateUtil.deepCopy(state)
    switch (action.type) {
        
        case UPDATE_RUN_ARGS_ACTION :
                newState.runArgs = action.runArgs
            break;

        case SELECT_FLOW_ACTION :
                newState.flow = action.flow

                //フロー選択時、フロー実行時使われる入力フローの初期化
                const inputPorts = newState.flow.ports[0]
                const params = newState.flow.params
                const runArgs = {
                    'flow_uuid' : newState.flow.uuid,
                    'flows' : inputPorts,
                    'variables' : params
                }
                newState.runArgs = runArgs
                
            break;
        
        default:
            break;
    }
    
    return newState
}

export const selectFlowAction = (flow) => {
    return {
        type : SELECT_FLOW_ACTION,
        flow : flow
    }
}
export const updateRunArgsAction = (runArgs) => {
    return {
      type: UPDATE_RUN_ARGS_ACTION,
      runArgs: runArgs
    }
}

export default flowList