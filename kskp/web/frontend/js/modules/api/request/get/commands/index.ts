import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
}

export function commands(props: Props) {
    const url = (props.url) ? props.url : URL.GET.commands
    return ApiBase.Get(url)
}
