import {API} from 'Modules/api/core/index'
import * as GET from './action/index'
import * as POST from 'Modules/api/thunk/post/action/index'
import axios from 'axios'

// GET
export function Flows(projectUUID:string, withoutNav?:boolean){
    return (dispatch) => {
        dispatch(GET.FlowsRequest(projectUUID, withoutNav))
        const nav = withoutNav ? '&navigation=off' : '&navigation=on'
        let url = API.FLOWS.URL + '?project='+ projectUUID + nav

        return axios.get(url)
            .then(res =>
                dispatch(GET.FlowsSuccess(res))
            ).catch(err => 
                dispatch(GET.FlowsFailure(err))
            )
    }
}

export function Flow(flowUUID:string, withoutNav?:boolean, withLock?:boolean) {
    return (dispatch) => {
        dispatch(GET.FlowRequest(flowUUID, withoutNav, withLock))
        const nav = withoutNav ? '?navigation=off' : '?navigation=on'
        let url = API.FLOWS.URL + '/'+ flowUUID + nav

        return axios.get(url)
            .then(res => {
                dispatch(GET.FlowsSuccess(res))
                if (withLock){
                    dispatch(POST.LocksRequest(flowUUID))
                    let url = API.LOCKS.URL
                    let body = {target:flowUUID}
                    axios.post(url, body)
                        .then(res => {
                            dispatch(POST.LocksSuccess(res))
                        }).catch(err => {
                            dispatch(POST.LocksFailure(err))
                        })
                } 
            }).catch(err => 
                dispatch(GET.FlowsFailure(err))
            )
    }
}

export function Commands(){
    return (dispatch) => {
        dispatch(GET.CommandsRequest())
        const url = API.COMMANDS.URL
        return axios.get(url)
            .then(res =>
                dispatch(GET.CommandsSuccess(res))
            ).catch(err => 
                dispatch(GET.CommandsFailure(err))
            )
    }
}

export function Visualizers() {
    return (dispatch) => {
        dispatch(GET.VisualizersRequest())
        const url = API.VISUALIZERS.URL
        return axios.get(url)
            .then(res =>
                dispatch(GET.VisualizersSuccess(res))
            ).catch(err => 
                dispatch(GET.VisualizersFailure(err))
            )
    }
}

export function Subflows() {
    return (dispatch) => {
        dispatch(GET.SubflowsRequest())
        const url = API.SUBFLOWS.URL
        return axios.get(url)
            .then(res =>
                dispatch(GET.SubflowsSuccess(res))
            ).catch(err => 
                dispatch(GET.SubflowsFailure(err))
            )
    }
}

export function Libraries(folder_uuid?:string) {
    return (dispatch) => {
        dispatch(GET.LibrariesRequest())
        let url = (folder_uuid) ? "folders/" : "library"
        return axios.get(url)
            .then(res => {
                try {
                    if (res.data.success) dispatch(GET.LibrariesSuccess(res))
                    if (!res.data.success && folder_uuid) { // awss3s
                        url = "awss3s"
                        axios.get(url).then(res => {
                            dispatch(GET.LibrariesSuccess(res))
                        }).catch(err => {
                            dispatch(GET.LibrariesFailure(err))
                        })
                    }
                } catch(e) {
                    console.log(e)
                }
            }).catch(err => {
                dispatch(GET.LibrariesFailure(err))
            })
    }
}

export function Stores() { 
    return (dispatch) => {
        dispatch(GET.StoresRequest())
        const url = 'stores'
        return axios.get(url)
            .then(res =>
                dispatch(GET.StoresSuccess(res))
            ).catch(err => 
                dispatch(GET.StoresFailure(err))
            )
    }
}