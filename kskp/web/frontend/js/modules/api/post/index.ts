import {ApiConstants, ApiBase} from 'Modules/api/core/index'

export function LOCKS(flowUUID:string, url:string=ApiConstants.LOCKS.URL.SERVICE) {
    const data = {target:flowUUID}
    
    return ApiBase.Post(url, data)
}

const defaultArgs = {
    "visualizer"  : "csvtohtmltable",
    "offset"      : 0,
    "limit:"      : 0
}
const defaultVizId = "csvtohtmltable"

export function VIZS(flowUUID:string|undefined, stepIds:string[]|undefined, frameUUID:string|undefined, vizId:string, args:{}) {
    
    let result
    if (flowUUID && stepIds) {
        result = VIZS_FROM_FLOW(flowUUID, stepIds, vizId, args)
    } else if (frameUUID) {
        result = VIZS_FROM_FRAME(frameUUID, vizId, args)
    } else {
        result = new Promise((resolve, reject) => {
            reject("API POST /VIZ unsupported parameter error")
        })
    }

    return result
}

function VIZS_FROM_FLOW(flowUUID:string, stepIds:string[], vizId:string=defaultVizId, args:{}=defaultArgs, url:string=ApiConstants.VIZS.URL.SERVICE) {
    url   = url + '?from=' + flowUUID
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

function VIZS_FROM_FRAME(frameUUID:string, vizId:string=defaultVizId, args:{}=defaultArgs,  url:string=ApiConstants.VIZS.URL.SERVICE) {
    url   = url + '/' + frameUUID
    let data = {
        "args"  : {
            "visualizer" : vizId,
            ...args
        }
    }

    return ApiBase.Post(url, data)
}

