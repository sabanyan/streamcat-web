import {ApiConstants} from 'Modules/api/core/index'

// Locks
export function LocksRequest(lockUUID:string) {
    return {
        type        : ApiConstants.LOCKS.ACTION.DELETE.REQUEST,
        flowUUID    : lockUUID
    }
}
export function LocksSuccess(res){return {type : ApiConstants.LOCKS.ACTION.DELETE.SUCCESS, res : res}}
export function LocksFailure(err){return {type : ApiConstants.LOCKS.ACTION.DELETE.FAILURE, err : err}}
