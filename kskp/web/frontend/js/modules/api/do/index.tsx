import { API } from 'Modules/api/index'

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
