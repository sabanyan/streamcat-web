import { CommonResponse, Response } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'

// ExtendLocks
type ExtendLocksData = {

}

export type ExtendLocksResponse = CommonResponse<ExtendLocksData>
export function extendLocks(res: Response<ExtendLocksResponse>): ExtendLocksData {
    if (!res.success) {
        throw new MessageModel({ title: "POST /extend-locks Exception", messageStatus: "warning", code: res.code, message: res.message })
    }
    return {}
}