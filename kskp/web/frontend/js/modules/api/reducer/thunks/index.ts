import {ApiConstants} from 'Modules/api/core/index'
import { LocksModel } from 'Model/index';

export function NewLocks(flowUUID:string) {
    return (dispatch, getState) => Promise.resolve().then(() => {
        const { apiReducer } = getState();
        dispatch({
                type        : "NEW_LOCKS",
                target      : flowUUID
            })  
    })
}

export function UpdateLocks(locks:LocksModel) {
    return (dispatch, getState) => Promise.resolve().then(() => {
        const { apiReducer } = getState();
        dispatch({
                type        : "UPDATE_LOCKS",
                locks      : locks
            })  
    })
}

export function DeleteLocks() {
    return (dispatch, getState) => Promise.resolve().then(() => {
        const { apiReducer } = getState();
        dispatch({
                type        : "DELETE_LOCKS"
            })  
    })
}

