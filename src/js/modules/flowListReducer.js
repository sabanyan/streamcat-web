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
import Validator from '../utils/Validator'
import Log from '../utils/Log'
import type { DataFrameStepModelProps } from '../model/Step/DataFrameStepModel'
import _ from 'lodash'
import ZoomUtil from '../utils/ZoomUtil'

let initialState = {

}

const flowListReducer = (state = initialState, action: {}) => {
    let newState = StateUtil.deepCopy(state)
    switch (action.type) {
        
        
        default:
        window.nodes = state.nodes
        return state
    }
    
    window.nodes = newState.nodes
    return newState
}

export default flowListReducer