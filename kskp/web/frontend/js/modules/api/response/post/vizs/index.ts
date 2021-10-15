import { CommonResponse, Response } from 'Modules/api/core/index';
import { MessageModel } from 'Model/index'
import { ActivitiesData } from '../activities'

type VisData = ActivitiesData;

export type VisResponse = CommonResponse<VisData, undefined>
export function vizs(res: Response<VisResponse>): VisData {
    if (!res.data.success) {
        throw new MessageModel({ title: "Post /vizs Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    } else if (!res.data.lasts) {
        throw new MessageModel({ title: "Post /vizs JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message })
    }

    return res.data.lasts
}
