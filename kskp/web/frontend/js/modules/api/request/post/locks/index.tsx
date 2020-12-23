import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    flowUUID: string,
    lastModifiedAt?: string
}

export function locks(props: Props) {
    const {lastModifiedAt} = props;
    const url = (props.url) ? props.url : URL.POST.locks
    const data = { target: props.flowUUID }
    if(lastModifiedAt)data["lastModifiedAt"] = lastModifiedAt;
    return ApiBase.Post(url, data)
}
