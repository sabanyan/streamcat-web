import {ApiBase, ApiConstants} from 'Modules/api/core/index'

// DELETE
export function Locks(lockUUID:string, url:string=ApiConstants.LOCKS.URL.SERVICE) {
    const result_url = url + '/' + lockUUID
    
    return navigator.sendBeacon(result_url)
}