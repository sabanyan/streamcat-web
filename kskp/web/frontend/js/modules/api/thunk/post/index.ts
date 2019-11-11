import {API} from 'Modules/api/core/index'
import * as POST from './action/index'
import axios from 'axios'

export function Locks(flowUUID:string) {
    return (dispatch) => {
        dispatch(POST.LocksRequest(flowUUID))
        let url = API.LOCKS.URL
        let body = {target:flowUUID}
 
        return axios.post(url, body)
            .then(res => {
                dispatch(POST.LocksSuccess(res))
            }).catch(err => {
                dispatch(POST.LocksFailure(err))
            })
    }
}