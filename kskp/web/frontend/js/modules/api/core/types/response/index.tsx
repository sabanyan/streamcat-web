export type CommonResponse<DataType> = {
    data: {
        success     : boolean
        data        : DataType
        message?    : string
        code?       : number
    }
}

export type Response<Type> = Type