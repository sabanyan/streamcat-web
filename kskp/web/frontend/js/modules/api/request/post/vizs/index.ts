import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    flowUUID:string|undefined
    stepIds:string[]|undefined
    frameUUID:string|undefined
    vizId:string
    args:{}
}

export function vizs(props:Props) {
    const {flowUUID, stepIds, frameUUID, vizId, args} = props
    const url = (props.url) ? props.url : URL.POST.vizs
    
    let result:Promise<any>|null = null
    if (frameUUID) {
        result = VIZS_FROM_FRAME(frameUUID, vizId, args, url)
    } else if (flowUUID && stepIds) {
        result = VIZS_FROM_FLOW(flowUUID, stepIds, vizId, args, url)
    } else {
        result = new Promise((resolve, reject) => {reject("unextpected paramter error is occured while requsting API POST /VIZ")})
    }

    return result
}

function VIZS_FROM_FLOW(flowUUID:string, stepIds:string[], vizId:string, args:{}, url:string) {
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

function VIZS_FROM_FRAME(frameUUID:string, vizId:string, args:{}, url:string) {
    url = url + '/' + frameUUID
    let data = {
        "args"  : {
            "visualizer" : vizId,
            ...args
        }
    }

    return ApiBase.Post(url, data)
}