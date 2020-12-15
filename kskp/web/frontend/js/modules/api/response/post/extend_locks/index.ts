import { CommonResponse, Response } from 'Modules/api/core/index';

import { MessageModel } from 'Model/index'

// ExtendLocks
type ExtendLocksData = {

}

export type ExtendLocksResponse = CommonResponse<undefined, ExtendLocksData>
export function extendLocks(res: Response<ExtendLocksResponse>): ExtendLocksData {
    if (!res.data.success) {
        throw new MessageModel({ title: "POST /extend-locks Exception", messageStatus: "warning", code: res.data.code, message: res.data.message })
    }
    // TODO レスポンスにユーザー情報が含まれるようになったら修正が必要
    // else if (!res.data.data) {
    //     alert("dd")
    //     throw new MessageModel({ title: "POST /extend-locks JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    // }
    return {}
}