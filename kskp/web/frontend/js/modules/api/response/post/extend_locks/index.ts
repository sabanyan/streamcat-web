import { CommonResponse, Response } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'

// ExtendLocks
type ExtendLocksData = {
    uuid: string,
    target: string,
    creater: number,
    created_at: string
}
export type ExtendLocksResponse = CommonResponse<undefined, ExtendLocksData>
export function extendLocks(res: Response<ExtendLocksResponse>): ExtendLocksData {
    if (!res.data.success) {
        throw new MessageModel({ title: "POST /extend-locks Exception", messageStatus: "warning", code: res.data.code, message: res.data.message })
    } else if (!res.data.data) {
        throw new MessageModel({ title: "POST /extend-locks JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }
    return res.data.data
}