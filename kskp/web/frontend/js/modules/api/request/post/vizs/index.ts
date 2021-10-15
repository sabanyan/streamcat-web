import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

// POST /vizsに渡す値型
type Data = {
    // プレビューするフローJSON
    flow?: {};
    // プレビューするフローのUUID
    uuid?: string;
    // プレビューするフレームのUUID
    frame?: string | null;
    // フローに渡すパラメータ
    args: {
        use_cache?: boolean;
        vis: {};
    };
    // ロックのUUID
    lock?: string;
}

type Props = Url & Data;

export function vizs(props:Props) {
    const url = (props.url) ? props.url : URL.POST.vizs;
    const data: Data = props;
    return ApiBase.Post(url, data);
}
