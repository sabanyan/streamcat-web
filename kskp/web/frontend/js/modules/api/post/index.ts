import {ApiConstants, ApiBase} from 'Modules/api/core/index'

export function LOCKS(flowUUID:string, url:string=ApiConstants.LOCKS.URL.SERVICE) {
    const data = {target:flowUUID}
    
    return ApiBase.Post(url, data)
}

export function VIZS(flowUUID:string|null, stepIds:string[]|null, frameUUID:string|null, vizId:string, args:{}, url:string=ApiConstants.VIZS.URL.SERVICE) {
    let result = new Promise((resolve, reject) => {reject("unextpected paramter error is occured while requsting API POST /VIZ")})
    if (flowUUID && stepIds) {
        result = VIZS_FROM_FLOW(flowUUID, stepIds, vizId, args, url)
    } else if (frameUUID) {
        result = VIZS_FROM_FRAME(frameUUID, vizId, args, url)
    }

    return result
}

function VIZS_FROM_FLOW(flowUUID:string, stepIds:string[], vizId:string, args:{}, url:string=ApiConstants.VIZS.URL.SERVICE) {
    url = url + '?from=' + flowUUID
    let data = {}
    stepIds.forEach((stepId, index) => {
        data[stepId] = {
            "args" : {
                "visualizer" : vizId,
                ...args
            }
        }
    })

    return ApiBase.Post(url, data)
}

function VIZS_FROM_FRAME(frameUUID:string, vizId:string, args:{}, url:string=ApiConstants.VIZS.URL.SERVICE) {
    url = url + '/' + frameUUID
    let data = {
        "args"  : {
            "visualizer" : vizId,
            ...args
        }
    }

    return ApiBase.Post(url, data)
}

