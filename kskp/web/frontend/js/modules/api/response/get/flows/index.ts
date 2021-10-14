import { CommonResponse } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'
import { FlowModelProps, FlowModel } from "Model/index";


export type FlowResponse = CommonResponse<undefined, FlowModelProps>
export function flow(res: any): FlowModel | undefined {
    let result

    if (!res.data.success) {
        throw new MessageModel({ title: "Get Flow Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }
    if (!res.data.data) {
        throw new MessageModel({ title: "Get /Flow JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }
    let props = {...res.data.data.flow, folderPath: res.data.data.folderPath, folderUuid: res.data.data.folderUuid};
    props.label = res.data.data.label;
    return new FlowModel(props)
}

