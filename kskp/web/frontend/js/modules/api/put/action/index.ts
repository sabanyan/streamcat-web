import {API} from 'Modules/api/core/index'

// Flows
export function FlowsRequest(flowUUID:string, body:{label:string, flow:{}, lock:string}) {
    return {
        type        : API.FLOWS.PUT.REQUEST,
        flowUUID    : flowUUID,
        body  : body
    }
}
export function FlowsSuccess(res){return {type : API.FLOWS.PUT.SUCCESS, res : res}}
export function FlowsFailure(err){return {type : API.FLOWS.PUT.FAILURE, err : err}}
