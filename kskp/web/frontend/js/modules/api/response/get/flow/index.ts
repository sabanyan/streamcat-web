import { CommonResponse } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'
import { FlowModelProps, FlowModel } from "Model/index";


export type FlowResponse = CommonResponse<undefined, FlowModelProps>
export function flow(res: FlowResponse): FlowModel | undefined {
    let result

    if (!res.data.success) {
        throw new MessageModel({ title: "Get Flow Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }
    if (!res.data.data) {
        throw new MessageModel({ title: "Get /Flow JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return new FlowModel(res.data.data)
}

