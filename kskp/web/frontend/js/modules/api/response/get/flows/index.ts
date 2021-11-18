import { CommonResponse } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'
import { FlowModelProps, FlowModel } from "Model/index";


export type FlowResponse = CommonResponse<FlowModelProps>
// export function flow(res: FlowResponse): FlowModel | undefined {

//     if (!res.success) {
//         throw new MessageModel({ title: "Get Flow Exception", messageStatus: "error", code: res.code, message: res.message })
//     }
//     if (!res.data) {
//         throw new MessageModel({ title: "Get /Flow JSON Parsing Exception", messageStatus: "error", code: res.code, message: res.message })
//     }
//     let props = {...res.data, folderPath: res.data.folderPath, folderUuid: res.data.folderUuid};
//     props.label = res.data.label;
//     return new FlowModel(props)
// }

