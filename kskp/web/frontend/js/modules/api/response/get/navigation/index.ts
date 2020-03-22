import { CommonResponse } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'
import { NavigationModel, NavigationModelProps } from "Model/index";


export type VizResponse = CommonResponse<undefined, NavigationModelProps>
export function navigation(res: VizResponse): NavigationModel | undefined {
    let result

    if (!res.data.success) {
        throw new MessageModel({ title: "Get Navi Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }
    if (!res.data.data) {
        throw new MessageModel({ title: "Get /navigaion JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return new NavigationModel(res.data.data)
}

