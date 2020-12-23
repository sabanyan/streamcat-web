import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    lockUUID: string
}

export function extendLocks(props: Props) {
    const url = (props.url) ? props.url : URL.POST.extend_locks
    return ApiBase.Post(url + "/" + props.lockUUID, {})
}
