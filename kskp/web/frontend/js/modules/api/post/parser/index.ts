// Vizs
type RESPONSE_VIZS = {
    id      : string,
    args    : {
        column_names    : string[]
    },
    contents    : string
}
type RESPONSE_VIZS_FROM_FLOW = {
    data: {
        success   : boolean
        lasts     : RESPONSE_VIZS[]
    }
}

type RESPONSE_VIZS_FROM_FRAME = {
    data: {
        success   : boolean
        lasts     : RESPONSE_VIZS
    }
}

export function VIZS_FROM_FLOW(res:RESPONSE_VIZS_FROM_FLOW) {
    let result:any = null
    try {
        result.headers  = res.data.lasts
    } catch(e) {
        console.log(e)
    } finally {
        return result
    }
}

export function VIZS_FROM_FRAME(res:RESPONSE_VIZS_FROM_FRAME) {
    let result:any = null
    try {
        result.headers  = res.data.lasts
    } catch(e) {
        console.log(e)
    } finally {
        return result
    }
}