import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

// POST /activitiesに渡す値型
type Data = {
    // 実行またはプレビューするフローJSON
    flow?: {};
    // 実行またはプレビューするフローのUUID
    uuid?: string;
    // フローに渡すパラメータ
    args?: {
        use_cache?: boolean;
        vis?: {};
    };
    // ロックのUUID
    lock?: string;
}

type Props = Url & Data;

export function activities(props:Props) {
    const url = (props.url) ? props.url : URL.POST.activities;
    const data: Data = props;
    return ApiBase.Post(url, data);
}
