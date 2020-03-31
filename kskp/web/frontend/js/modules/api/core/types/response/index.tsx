export type CommonResponse<lasts, data> = {
    data: {
        success     : boolean
        lasts       : lasts
        data        : data
        message?    : string
        code?       : number
    }
}

export type Response<Type> = Type