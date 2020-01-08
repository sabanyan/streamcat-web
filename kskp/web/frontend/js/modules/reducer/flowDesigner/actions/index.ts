import { FlowModelProps } from 'Model/index';
import * as actionTypes from './types/index'

/**
 * JSONの読み込み
 * @param context
 * @returns {{type: string, context: *}}
 */
export function loadFlowAction(flowModelProps: FlowModelProps) {
    return {
        type: actionTypes.LOAD_FLOW_ACTION,
        flowModelProps: flowModelProps
    }
}