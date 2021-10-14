import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    frameUUID: string;
    contents?: boolean;
}

export function frames(props: Props) {
    const url = (props.url) ? props.url : URL.GET.frames
    const data = {
        contents: props.contents ? 'contents' : undefined,
    }
    const resultUrl = url + '/' + props.frameUUID
    return ApiBase.Get(resultUrl, data)
}
