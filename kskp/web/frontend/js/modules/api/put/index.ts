import {ApiConstants, ApiBase} from 'Modules/api/core/index'
import * as Action from './action/index'
import {Locks as Post_Locks} from '../post/index'
import { FlowModel } from 'Model/index';

// PUT

export function Flow(flowUUID:string, flow:FlowModel, lockUUID:string, onSuccess?:Function, url:string=ApiConstants.FLOWS.URL.SERVICE) {
    const data = {
        label:flow.label,
        flow :flow,
        lock:lockUUID
    }
    const result_url = url + '/' + flowUUID
    
    const onThen = (res, dispatch, getState) => {
        dispatch(Action.FlowsSuccess(res))
        if (onSuccess) onSuccess(res, getState)
    }

    return ApiBase.request(ApiConstants.METHOD.POST, url, data, undefined, onThen)
}
