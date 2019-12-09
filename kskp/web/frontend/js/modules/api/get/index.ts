import {ApiConstants, ApiBase} from 'Modules/api/core/index'

export function NAVIGATION(flow_uuid?:string, project_uuid?:string, url:string=ApiConstants.NAVIGATION.URL.SERVICE) {
        let data = {
            flow_uuid       : (flow_uuid && flow_uuid !== '') ?  flow_uuid : undefined,
            project_uuid    : (project_uuid  && project_uuid !== '') ? project_uuid : undefined
        }

        return ApiBase.Get(url, data)
}

export function Flows(projectUUID:string, url:string=ApiConstants.FLOWS.URL.SERVICE) {
        const data = {
            project : projectUUID,
            navigation : 'off'
        }

        return ApiBase.Get(url, data)
}

export function Flow(flowUUID:string, url:string=ApiConstants.FLOWS.URL.SERVICE) {
        const data = {
            navigation : 'off'
        }
        let result_url = url + '/' + flowUUID

        return ApiBase.Get(result_url, data)
}
   
/*
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
*/


export function Commands(url:string=ApiConstants.COMMANDS.URL.SERVICE) {
    return ApiBase.Get(url)
}

export function Visulizers(url:string=ApiConstants.VISUALIZERS.URL.SERVICE) {
    return ApiBase.Get(url)
}

export function Subflows(url:string=ApiConstants.SUBFLOWS.URL.SERVICE) {
    return ApiBase.Get(url)
}