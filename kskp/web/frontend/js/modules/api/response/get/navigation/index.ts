import { CommonResponse } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'
import { NavigationModel, NavigationModelProps } from "Model/index";


export type VizResponse = CommonResponse<NavigationModelProps>
export function navigation(res: VizResponse): NavigationModel | undefined {
    let result

    if (!res.success) {
        throw new MessageModel({ title: "Get Navi Exception", messageStatus: "error", code: res.code, message: res.message })
    }
    if (!res.data) {
        throw new MessageModel({ title: "Get /navigaion JSON Parsing Exception", messageStatus: "error", code: res.code, message: res.message })
    }

    return new NavigationModel(res.data)
}

