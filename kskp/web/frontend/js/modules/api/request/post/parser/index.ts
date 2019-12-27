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
export function VIZS(res: Response<VizResponse>): VizsData {
    if (!res.data.success) {
        if (res.data.message !== "VisualizeInitException") {
            throw new MessageModel({ title: "POST /vizs Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
        }
    } else if (!res.data.lasts) {
        throw new MessageModel({ title: "POST /vizs JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return res.data.lasts
}

// Locks
type LocksData = {
    uuid: string,
    target: string,
    creater: number,
    created_at: string
}
export type LockResponse = CommonResponse<undefined, LocksData>
export function LOCKS(res: Response<LockResponse>): LocksData {
    if (!res.data.success) {
        throw new MessageModel({ title: "POST /locks Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    } else if (!res.data.data) {
        throw new MessageModel({ title: "POST /locks JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return res.data.data
}