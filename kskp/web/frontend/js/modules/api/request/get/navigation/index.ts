import { ApiBase } from 'Modules/api/core/index'
import { URL } from 'Modules/api/core/url/index';
import { Url } from "Modules/api/core/types/request";

type Props = Url & {
    flowUUID: string | undefined
    projectUUID: string | undefined
}

export function navigation(props: Props) {
    const { flowUUID, projectUUID, url } = props
    const data = {
        flow_uuid: (flowUUID && flowUUID !== '') ? flowUUID : undefined,
        project_uuid: (projectUUID && projectUUID !== '') ? projectUUID : undefined
    }
    const requestUrl = (url) ? url : URL.GET.navigation 

    return ApiBase.Get(requestUrl, data)
}