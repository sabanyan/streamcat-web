import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url, LockUUID } from "Modules/api/core/types/request";
import axios from 'axios'

type Props = Url & LockUUID & {
    flowUUID: string
}
// DELETE
export function flow(props: Props) {
    const url = (props.url) ? props.url : URL.DELETE.flow
    const result_url = url + '/' + props.flowUUID
    const data = {
        lock: props.lockUUID
    }

    return ApiBase.Delete(result_url, {}, data)
}