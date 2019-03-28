//@flow
import StateUtil from '../utils/State'
import _ from 'lodash'

const UPDATE_RUN_ARGS_ACTION = 'update_run_args_action'

let initialState = {
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
        
        default:
            window.nodes = state.nodes
    }
    
    window.nodes = newState.nodes
    return newState
}

export const updateRunArgsAction = (runArgs) => {
    return {
      type: UPDATE_RUN_ARGS_ACTION,
      runArgs: runArgs
    }
}

export default flowList