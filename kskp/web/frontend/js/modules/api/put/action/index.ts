import {ApiConstants} from 'Modules/api/core/index'

// Flows
export function FlowsRequest(flowUUID:string, body:{label:string, flow:{}, lock:string}) {
    return {
        type        : ApiConstants.FLOW.ACTION.PUT.REQUEST,
        flowUUID    : flowUUID,
        body  : body
    }
}
export function FlowsSuccess(res){return {type : ApiConstants.FLOW.ACTION.PUT.SUCCESS, res : res}}
export function FlowsFailure(err){return {type : ApiConstants.FLOW.ACTION.PUT.FAILURE, err : err}}
