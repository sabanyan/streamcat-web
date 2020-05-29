import { ApiBase } from 'Modules/api/core/index'
import { Url } from "Modules/api/core/types/request";

// PUT
export type Props = Url & {
    trashUUID: string
}
const default_url = "api/v0/trashes"
export function trash(props: Props) {
    const url = (props.url) ? props.url : default_url
    const resultUrl = url + '/' + props.trashUUID

    return ApiBase.Put(resultUrl, {})
}
