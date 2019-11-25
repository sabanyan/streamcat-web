import {ApiConstants, ApiBase} from 'Modules/api/core/index'
import { FlowModel } from 'Model/index';

// PUT

export function Flow(flowUUID:string, flow:FlowModel, lockUUID:string, url:string=ApiConstants.FLOWS.URL.SERVICE) {
    const data = {
        label:flow.label,
        flow :flow,
        lock:lockUUID
    }
    const result_url = url + '/' + flowUUID

    return ApiBase.Put(result_url, data)
}
