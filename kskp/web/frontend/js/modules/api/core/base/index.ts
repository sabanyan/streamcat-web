import ApiConstants from 'Modules/api/core/constants/index'
import axios from 'axios'

export default class ApiBase {

    public request(method, url, data, onRequest?:Function, onThen?:Function, onCatch?:Function) {
    
        switch (method) {
            case ApiConstants.METHOD.GET   : this.get(url, data, onRequest, onThen, onCatch)
                break;
            case ApiConstants.METHOD.GET   : this.put(url, data,  onRequest, onThen, onCatch)
                break;
            case ApiConstants.METHOD.GET   : this.post(url, data,  onRequest, onThen, onCatch)
                break;
            case ApiConstants.METHOD.GET   : this.delete(url, data,  onRequest, onThen, onCatch)
                break;

                default:
                    break;
        }
    }

    private get (url:string, data?:{}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
        return (dispatch, getState) => {
            if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
            return axios.get(url, (data)?{params: data}:{})
                .then((res) => {if(onThen) onThen(res, dispatch, getState)})
                .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
        }
    }

    private post (url:string, data:{}, config:{}={}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
        return (dispatch, getState) => {
            if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
            return axios.post(url, data, config)
                .then((res) => {if(onThen) onThen(res, dispatch, getState)})
                .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
        }
    }

    private put (url:string, data:{}, config:{}={}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
        return (dispatch, getState) => {
            if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
            return axios.put(url, data, config)
                .then((res) => {if(onThen) onThen(res, dispatch, getState)})
                .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
        }
    }

    private delete (url:string, data?:{}, onRequest?:Function, onThen?:Function, onCatch?:Function) {
        return (dispatch, getState) => {
            if(onRequest) (dispatch, getState) => onRequest(dispatch, getState)
            return axios.delete(url, (data)?{params: data}:{})
                .then((res) => {if(onThen) onThen(res, dispatch, getState)})
                .catch((err) => {if(onCatch) onCatch(err, dispatch, getState)})
        }
    }
}