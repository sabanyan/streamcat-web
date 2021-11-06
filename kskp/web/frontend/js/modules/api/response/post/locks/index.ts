import { CommonResponse, Response } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'

// Locks
type LocksData = {
    uuid: string,
    target: string,
    creater: number,
    created_at: string
}
export type LockResponse = CommonResponse<LocksData>
export function locks(res: Response<LockResponse>): LocksData {
    if (!res.success) {
        throw new MessageModel({ title: "POST /locks Exception", messageStatus: "warning", code: res.code, message: res.message })
    } else if (!res.data) {
        throw new MessageModel({ title: "POST /locks JSON Parsing Exception", messageStatus: "error", code: res.code, message: res.message })
    }

    return res.data
}