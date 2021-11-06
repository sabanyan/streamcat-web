import { CommonResponse, Response } from 'Modules/api/core/index';
import { MessageModel } from 'Model/index'
import { ActivitiesData } from '../activities'

type VisData = ActivitiesData;

export type VisResponse = CommonResponse<VisData>
export function vizs(res: Response<VisResponse>): VisData {
    if (!res.success) {
        throw new MessageModel({ title: "Post /vizs Exception", messageStatus: "error", code: res.code, message: res.message })
    } else if (!res.data) {
        throw new MessageModel({ title: "Post /vizs JSON Parsing Exception", messageStatus: "error", code: res.code, message: res.message })
    }

    return res.data
}
