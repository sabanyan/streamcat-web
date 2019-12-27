import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url, LockUUID } from "Modules/api/core/types/request";

type Props = Url & LockUUID & {
    flowUUID:string
}

export function locks(props:Props) {
    const url = (props.url) ? props.url : URL.POST.locks
    const data = {target:props.flowUUID}
    
    return ApiBase.Post(url, data)
}