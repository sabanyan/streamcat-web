import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
}

const request_url = "/api/v0/trashes"
export function trashes(props: Props) {
    const url = (props.url) ? props.url : request_url
    return ApiBase.Get(url)
}
