import ApiConstants from 'Modules/api/core/constants/index'
import axios from 'axios'

export function request(method, url, data, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    let result:any
    switch (method) {
        case ApiConstants.METHOD.GET   : result = doGet(url, data, onRequest, onThen, onCatch)
            break;
        case ApiConstants.METHOD.GET   : result = doPut(url, data,  onRequest, onThen, onCatch)
            break;
        case ApiConstants.METHOD.GET   : result = doPost(url, data,  onRequest, onThen, onCatch)
            break;
        case ApiConstants.METHOD.GET   : result = doDelete(url, data,  onRequest, onThen, onCatch)
            break;

            default:
                break;
    }

    return result
}

export function doGet (url:string, data?:{}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)

        return axios.get(url, (data)?{params: data}:{})
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}

export function doPost (url:string, data:{}, config:{}={}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
        return axios.post(url, data, config)
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}

export function doPut (url:string, data:{}, config:{}={}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
        return axios.put(url, data, config)
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}

export function doDelete (url:string, data?:{}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
        return axios.delete(url, (data)?{params: data}:{})
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}
