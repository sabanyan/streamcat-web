import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    target: string
}

export function locks(props: Props) {
    const url = (props.url) ? props.url : URL.POST.locks
    const data = { target: props.target }

    return ApiBase.Post(url, data)
}
