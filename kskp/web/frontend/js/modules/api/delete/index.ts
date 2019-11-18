import {ApiBase, ApiConstants} from 'Modules/api/core/index'
import * as Action from './action/index'

// DELETE
export function Locks(lockUUID:string, onSuccess?:Function, url:string=ApiConstants.LOCKS.URL.SERVICE) {
    const result_url = url + '/' + lockUUID
    const onRequest = (dispatch, getState) => {
        dispatch(Action.LocksRequest(lockUUID))
    }

    const onThen = (res, dispatch, getState) => {
        dispatch(Action.LocksSuccess(res))
        if (onSuccess) onSuccess(res, getState)
    }
    
    ApiBase.request(ApiConstants.METHOD.DELETE, url, undefined, onRequest, onThen)
}