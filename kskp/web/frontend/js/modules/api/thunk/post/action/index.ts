import {API} from 'Modules/api/core/index'


// Locks
export function LocksRequest(flowUUID:string) {
    return {
        type        : API.LOCKS.POST.REQUEST,
        target    : flowUUID
    }
}
export function LocksSuccess(res){return {type : API.LOCKS.POST.SUCCESS, res : res}}
export function LocksFailure(err){return {type : API.LOCKS.POST.FAILURE, err : err}}
