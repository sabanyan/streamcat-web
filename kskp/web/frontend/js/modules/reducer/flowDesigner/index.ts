import * as ActionType from './actions/types/index'

import { FlowModelProps, VisualizeModelProps,
     CommandModelProps, SubFlowStepModelProps} from 'Model/index';
import Graph from 'Modules/graph/index'

type State = {
    visualizers: VisualizeModelProps[],
    commands: CommandModelProps[],
    subflows: SubFlowStepModelProps[],
    flow?: FlowModelProps,
    graph?: Graph,
    history: {
        current: number,
        nodes: any[]
    },
    zoom:number,
    drag: {},
    selectedStepIds: any[],
    selectedDataSourceDetail:any[]
}

const initialState:State = {
    visualizers: [],
    commands: [],
    subflows: [],
    flow: undefined,
    graph: undefined,
    history: {
        current: 0,
        nodes: []
    },
    zoom:100,
    drag: {},
    selectedStepIds: [],
    selectedDataSourceDetail:[]
}

export function flowDesignerReducer(state:State = initialState, action) {
    let newState = state
    switch (action.type) {
        case ActionType.LOAD_FLOW_ACTION:
            const {props} = action

            break;
        default:
            break;
    }

    return newState
}

/*
function LoadFlow(state:State, props:FlowModelProps) {
    const flow = new FlowModel(props)
    
    let newState = {
        ...state,
        flow : flow,
        graph: state.graph.getGraph(flow.nodes, state.zoom)
    }

    return 
}
*/