import {ApiConstants, ApiBase} from 'Modules/api/core/index'
import * as Action from './action/index'

// PUT
export default class Post extends ApiBase {
    
    Flow(flowUUID:string, onSuccess?:Function, url:string=ApiConstants.FLOWS.URL.SERVICE) {
        const data = {target:flowUUID}
        const result_url = 
       
        const onRequest = (dispatch, getState) => {
            dispatch(Action.LocksRequest(flowUUID))
        }

        const onThen = (res, dispatch, getState) => {
            dispatch(Action.LocksSuccess(res))
            if (onSuccess) onSuccess(res, getState)
        }

        super.request(ApiConstants.METHOD.POST, url, data, onRequest, onThen)
    }

}

export function Flow(flowUUID:string, body: {label: string, flow: {}, lock: string}) {
    return (dispatch) => {
        dispatch(PUT.FlowsRequest(flowUUID, body))
        let url = API.FLOWS.URL + '/'+ flowUUID

        return axios.get(url)
            .then(res =>
                dispatch(PUT.FlowsSuccess(res))
            ).catch(err => 
                dispatch(PUT.FlowsFailure(err))
            )
    }
}