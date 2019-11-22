import {ApiConstants, ApiBase} from 'Modules/api/core/index'
import * as Action from './action/index'
import axios from 'axios'



export function Navigation(flow_uuid?:string, project_uuid?:string, onSuccess?:Function, url:string=ApiConstants.NAVIGATION.URL.SERVICE) {
        let data = {
            flow_uuid       : (flow_uuid && flow_uuid !== '') ?  flow_uuid : undefined,
            project_uuid    : (project_uuid  && project_uuid !== '') ? project_uuid : undefined
        }

        return ApiBase.get(url, data)
}

export function Flows(projectUUID:string, onSuccess?:Function, url:string=ApiConstants.FLOWS.URL.SERVICE) {
        const data = {
            project : projectUUID,
            navigation : 'off'
        }

        const onThen = (res, dispatch, getState) => {
            dispatch(Action.FlowsRequest(res))
            if (onSuccess) onSuccess(res, getState)
        }

        return ApiBase.request(ApiConstants.METHOD.GET, url, data, undefined, onThen)
}

export function Flow(flowUUID:string, onSuccess?:Function, url:string=ApiConstants.FLOWS.URL.SERVICE) {
        const data = {
            navigation : 'off'
        }
        let result_url = url + '/' + flowUUID

        const onThen = (res, dispatch, getState) => {
            dispatch(Action.FlowsSuccess(res))
            if (onSuccess) onSuccess(res, getState)
        }

        return ApiBase.request(ApiConstants.METHOD.GET, result_url, data, undefined, onThen)
}
   
    
export function Libraries(folder_uuid?:string, onSuccess?:Function) {
    return (dispatch, getState) => {
        let url = (folder_uuid) ? "folders/" + folder_uuid  : "library"
        return axios.get(url)
            .then(res => {
                if (res.data.success) dispatch(Action.LibrariesSuccess(res))
                if (!res.data.success && folder_uuid) { // awss3s
                    url = "awss3s"
                    axios.get(url).then(res => {
                        dispatch(Action.LibrariesSuccess(res))
                        if (onSuccess) onSuccess(res, getState)
                    }).catch(err => {
                        console.log(err)
                    })
                }
            }).catch(err => {
                console.log(err)
            })
    } 
}


export function Commands(onSuccess?:Function, url:string=ApiConstants.COMMANDS.URL.SERVICE) {
    const onThen = (res, dispatch, getState) => {
        dispatch(Action.CommandsSuccess(res))
        if (onSuccess) onSuccess(res, getState)
    }

    return ApiBase.request(ApiConstants.METHOD.GET, url, undefined, undefined, onThen)
}

export function Visulizers(onSuccess?:Function, url:string=ApiConstants.VISUALIZERS.URL.SERVICE) {
    const onThen = (res, dispatch, getState) => {
        dispatch(Action.VisualizersSuccess(res))
        if (onSuccess) onSuccess(res, getState)
    }

    return ApiBase.request(ApiConstants.METHOD.GET, url, undefined, undefined, onThen)
}

export function Subflows(onSuccess?:Function, url:string=ApiConstants.SUBFLOWS.URL.SERVICE) {
    const onThen = (res, dispatch, getState) => {
        dispatch(Action.SubflowsSuccess(res))
        if (onSuccess) onSuccess(res, getState)
    }

    return ApiBase.request(ApiConstants.METHOD.GET, url, undefined, undefined, onThen)
}