import { CommonResponse, Response } from 'Modules/api/core/index';
import { MessageModel } from 'Model/index';

type Outs = {
    // 出力Pointのid
    id: string;
    // 出力Pointのラベル名
    label: string;
    // 出力データのUUID
    uuid: string;
    // 出力データが格納されているフォルダのUUID
    parent: string | null;
    // 出力データの列名一覧
    args: {column_names: string[]};
    // HTMLに変換したVisデータ
    contents: string | null;
}

export type ActivitiesData = {
    // 新規作成したActivityのUUID
    uuid: string;
    // 固定値'activity'
    type: 'activity';
    // 新規作成したActivityのラベル名
    label: string;
    // 出力結果情報
    outs: Outs[];
}

export type ActivitiesResponse = CommonResponse<ActivitiesData>
export function activities(res: Response<ActivitiesResponse>): ActivitiesData {
    if (!res.success) {
        throw new MessageModel({ title: "Post /activities Exception", messageStatus: "error", code: res.code, message: res.message });
    } else if (!res.data) {
        throw new MessageModel({ title: "Post /activities JSON Parsing Exception", messageStatus: "error", code: res.code, message: res.message });
    }
    return res.data;
}
