import {API} from 'Modules/api/core/index'
import * as PUT from './action/index'
import axios from 'axios'

// PUT

export function Flows(flowUUID:string, body: {label: string, flow: {}, lock: string}) {
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