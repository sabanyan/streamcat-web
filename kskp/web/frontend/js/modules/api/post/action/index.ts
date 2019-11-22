import {ApiConstants} from 'Modules/api/core/index'


// Locks
export function LocksRequest(flowUUID:string) {
    return {
        type        : ApiConstants.LOCKS.ACTION.POST.REQUEST,
        target    : flowUUID
    }
}
export function LocksSuccess(res){return {type : ApiConstants.LOCKS.ACTION.POST.SUCCESS, res : res}}
export function LocksFailure(err){return {type : ApiConstants.LOCKS.ACTION.POST.FAILURE, err : err}}
