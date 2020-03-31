import { CommonResponse, Response } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'

// Locks
type LocksData = {
    uuid: string,
    target: string,
    creater: number,
    created_at: string
}
export type LockResponse = CommonResponse<undefined, LocksData>
export function locks(res: Response<LockResponse>): LocksData {
    if (!res.data.success) {
        throw new MessageModel({ title: "POST /locks Exception", messageStatus: "warning", code: res.data.code, message: res.data.message })
    } else if (!res.data.data) {
        throw new MessageModel({ title: "POST /locks JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return res.data.data
}