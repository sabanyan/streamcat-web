import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    flowUUID: string
}

export function flow(props: Props) {
    const data = {
        navigation: 'off'
    }
    const url = (props.url) ? props.url : URL.GET.flows
    let resultUrl = url + '/' + props.flowUUID

    return ApiBase.Get(resultUrl, data)
}
