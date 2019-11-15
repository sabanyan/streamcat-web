import {API} from 'Modules/api/core/index'

// Locks
export function LocksRequest(lockUUID:string) {
    return {
        type        : API.LOCKS.DELETE.REQUEST,
        flowUUID    : lockUUID
    }
}
export function LocksSuccess(res){return {type : API.LOCKS.DELETE.SUCCESS, res : res}}
export function LocksFailure(err){return {type : API.LOCKS.DELETE.FAILURE, err : err}}
