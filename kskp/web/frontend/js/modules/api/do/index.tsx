import { API } from 'Modules/api/index'

import { Response } from '../core/index'
import { LockResponse } from '../post/parser'


export function ExclusiveDo(flowUUID, promisedTask:Function, promisedProps:{}) {
    let lockUUID: string | null = null

    return API.REQUEST.POST.LOCKS(flowUUID)
        .then((res: Response<LockResponse>) => {
            lockUUID = API.RESPONSE.PARSE.POST.LOCKS(res).uuid
            promisedProps = {"lockUUID":lockUUID, ...promisedProps}
            task()
            

            API.REQUEST.DELETE.Locks(lockUUID)
        })
}

export function PutFlow(flowUUID, task:Promise<any>) {
    let lockUUID: string | null = null

    return API.REQUEST.POST.LOCKS(flowUUID)
        .then((res: Response<LockResponse>) => {
            lockUUID = API.RESPONSE.PARSE.POST.LOCKS(res).uuid
            API.REQUEST.PUT.Flow(flowUUID, null, lockUUID)

            API.REQUEST.DELETE.Locks(lockUUID)
        })
}

new Promise((resolve, reject) => {

})
ExclusiveDo("", API.REQUEST.PUT.Flow())