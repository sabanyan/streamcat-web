import { CommonResponse, Response } from 'Modules/api/core/index';
import { MessageModel } from 'Model/index';

type FramesData = {
    // 新規作成したActivityのUUID
    uuid: string;
    // 固定値'activity'
    type: 'frame';
    // 新規作成したActivityのラベル名
    label: string;
    // 出力データの列名一覧
    args: {column_names: string[]};
    // HTMLに変換したVisデータ
    contents: string | null;   
}

export type FramesResponse = CommonResponse<undefined, FramesData>
export function frames(res: Response<FramesResponse>): FramesData {
    if (!res.data.success) {
        throw new MessageModel({ title: "Get /frames Exception", messageStatus: "error", code: res.data.code, message: res.data.message });
    } else if (!res.data.data) {
        throw new MessageModel({ title: "Get /frames JSON Parsing Exception", messageStatus: "error", code: res.data.code, message: res.data.message });
    }
    return res.data.data;
}
