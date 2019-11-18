import {ApiConstants, ApiBase} from 'Modules/api/core/index'
import * as Action from './action/index'


export function Locks(flowUUID:string, onSuccess?:Function, url:string=ApiConstants.LOCKS.URL.SERVICE) {
    const data = {target:flowUUID}
    
    const onRequest = (dispatch, getState) => {
        dispatch(Action.LocksRequest(flowUUID))
    }

    const onThen = (res, dispatch, getState) => {
        dispatch(Action.LocksSuccess(res))
        if (onSuccess) onSuccess(res, getState)
    }

    return ApiBase.request(ApiConstants.METHOD.POST, url, data, onRequest, onThen)
}
