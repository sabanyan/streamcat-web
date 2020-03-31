import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

export type Props = Url & {
}

export function visualizers(props: Props) {
    const url = (props.url) ? props.url : URL.GET.visualizers
    return ApiBase.Get(url)
}
