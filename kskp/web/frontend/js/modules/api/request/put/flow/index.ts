import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url, LockUUID } from "Modules/api/core/types/request";

import {FlowModel, FlowModelProps} from "Model/index";

// PUT
export type Props = Url & LockUUID & {
    flowUUID: string
    flow: FlowModelProps
}

export function flow(props: Props) {
    const data = {
        label: props.flow.label,
        flow: props.flow,
        lock: props.lockUUID
    }
    const url = (props.url) ? props.url : URL.PUT.flows
    const resultUrl = url + '/' + props.flowUUID

    return ApiBase.Put(resultUrl, data)
}
