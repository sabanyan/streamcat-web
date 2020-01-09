import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url, LockUUID } from "Modules/api/core/types/request";

type Props = Url & LockUUID & {
}
// DELETE
export function locks(props:Props) {
    const url = (props.url) ? props.url : URL.DELETE.locks
    const result_url = url + '/' + props.lockUUID

    return ApiBase.Post(result_url, {})
}