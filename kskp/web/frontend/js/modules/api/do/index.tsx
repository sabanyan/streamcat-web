import { API } from 'Modules/api/index'
import { MessageModel } from 'Model/index';

export function lockedDo(flowUUID, promisedTask: Function, promisedProps: {}) {

    return API.request.doPost.locks({ flowUUID: flowUUID })
        .then(async (res) => {
            const locksData = API.response.post.locks(res)
            const lockUUID = locksData.uuid
            const props = { ...promisedProps, lockUUID: lockUUID }

            await promisedTask(props)
            await API.request.doDelete.locks({ lockUUID: lockUUID })
        })
}

export function checkDo(isValid: Function, promisedTask: Function, promisedProps: {}) {
    if (!isValid()) throw new MessageModel()

    return promisedTask(promisedProps)
}