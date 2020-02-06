import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
}

const url = "/api/v0/trashes"
export function trashes(props: Props) {
    const url = (props.url) ? props.url : URL.GET.subflows
    return ApiBase.Get(url)
}
