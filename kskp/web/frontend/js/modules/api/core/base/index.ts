import ApiConstants from 'Modules/api/core/constants/index'
import axios from 'axios'

/*
export function request(method, url, data, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    let result:any
    switch (method) {
        case ApiConstants.METHOD.GET   : result = doGet(url, data, onRequest, onThen, onCatch)
            break;
        case ApiConstants.METHOD.PUT   : result = doPut(url, data, {},  onRequest, onThen, onCatch)
            break;
        case ApiConstants.METHOD.POST   : result = doPost(url, data, {}, onRequest, onThen, onCatch)
            break;
        case ApiConstants.METHOD.DELETE   : result = doDelete(url, data,  onRequest, onThen, onCatch)
            break;

            default:
                break;
    }

    return result
}

export function doGet (url:string, data?:{}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) onRequest(dispatch, getState)

        return axios.get(url, (data)?{params: data}:{})
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}

export function doPost (url:string, data:{}, config:{}={}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) onRequest(dispatch, getState)
        return axios.post(url, data, config)
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}

export function doPut (url:string, data:{}, config:{}={}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) onRequest(dispatch, getState)
        return axios.put(url, data, config)
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}

export function doDelete (url:string, data?:{}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    return (dispatch, getState) => {
        if(onRequest) onRequest(dispatch, getState)
        return axios.delete(url, (data)?{params: data}:{})
            .then((res) => {if(onThen) onThen(res, dispatch, getState)})
            .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
    }
}
*/

export function Get (url:string, queryParam:{}={}) {
    return axios.get(url, (queryParam)?{params: queryParam}:{})
}

export function Post (url:string, data:{}, config:{}={}) {
        return axios.post(url, data, config)
}

export function Put (url:string, data:{}, config:{}={}) {
    return axios.put(url, data, config)
}

export function Delete (url:string, queryParam:{}={}) {
    return axios.delete(url, (queryParam)?{params: queryParam}:{})
}
