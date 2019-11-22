import {ApiConstants, ApiBase} from 'Modules/api/core/index'
import * as Action from './action/index'

export function Locks(flowUUID:string, url:string=ApiConstants.LOCKS.URL.SERVICE) {
    const data = {target:flowUUID}
    
    return ApiBase.post(url, data)
}

const defaultArgs = {
    "visualizer"  : "csvtohtmltable",
    "offset"      : 0,
    "limit:"      : 0
}
const defaultVizId = "csvtohtmltable"

export function VIZS_FROM_FLOW(flowUUID:string, stepIds:string[], vizId:string=defaultVizId, args:{}=defaultArgs, url:string=ApiConstants.VIZS.URL.SERVICE) {
    url   = 'vizs?from=' + flowUUID
    let data = {}
    stepIds.forEach((stepId, index) => {
        data[stepId] = {
            "args" : {
                "visualizer" : vizId,
                ...args
            }
        }
    })

    return ApiBase.post(url, data)
}

export function VIZS_FROM_FRAME(frameUUID:string, args:{}=defaultArgs, vizId:string=defaultVizId,  url:string=ApiConstants.VIZS.URL.SERVICE) {
    url   = 'vizs?from=' + frameUUID
    let data = {
        "visualizer" : vizId,
        ...args
    }

    return ApiBase.post(url, data)
}

