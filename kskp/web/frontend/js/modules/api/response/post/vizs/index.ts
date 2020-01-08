import { CommonResponse, Response } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'


// Vizs
type VizsData = Array<{
    id: string,
    args: {
        column_names: string[]
    },
    contents: string
}>
export type VizResponse = CommonResponse<VizsData, undefined>
export function vizs(res: Response<VizResponse>): VizsData {
    if (!res.data.success) {
        if (res.data.message !== "VisualizeInitException") {
            throw new MessageModel({ title: "Post /vizs Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
        }
    } else if (!res.data.lasts) {
        throw new MessageModel({ title: "Post /vizs JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return res.data.lasts
}
