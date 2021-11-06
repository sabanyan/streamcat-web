export type CommonResponse<DataType> = {
    success     : boolean
    data        : DataType
    message?    : string
    code?       : number
}

export type Response<Type> = Type