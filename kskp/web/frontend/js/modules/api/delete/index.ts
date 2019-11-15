import {API} from 'Modules/api/core/index'
import * as DELETE from './action/index'
import axios from 'axios'

// DELETE
export function Locks(lockUUID:string) {
    return (dispatch, getState) => {
        dispatch(DELETE.LocksRequest(lockUUID))
        let locks = getState().apiReducer.locks
        if (locks && locks.lastData && locks.lastData.lockId) {
            let uuid = locks.lastData.lockId
            console.log(uuid)
        }
        /*

        let url = API.LOCKS.URL + '/'+ lockUUID
        url = "zzzzzzzzzzzss"

        return axios.delete(url)
            .then(res =>
                dispatch(DELETE.LocksSuccess(res))
            ).catch(err => 
                dispatch(DELETE.LocksFailure(err))
            )
        */
    }
}