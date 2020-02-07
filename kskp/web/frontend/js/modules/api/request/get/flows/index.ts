import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    projectUUID: string
}

export function flows(props: Props) {
    const data = {
        project : props.projectUUID,
        navigation: 'off'
    }
    const url = (props.url) ? props.url : URL.GET.flows
    const resultUrl = url
    return ApiBase.Get(resultUrl, data)
}
