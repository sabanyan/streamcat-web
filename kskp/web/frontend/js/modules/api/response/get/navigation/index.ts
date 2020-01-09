import { CommonResponse } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'
import { NavigationModel } from "Model/index";


type NavigationData = {
    user_id: string | "",
    user_name: string | "",
    project_uuid: string | "",
    project_name: string | "",
    flow_uuid: string | "",
    flow_name: string | ""
}
export type VizResponse = CommonResponse<undefined, NavigationData>
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

