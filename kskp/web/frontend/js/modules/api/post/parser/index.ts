import {MessageModel} from 'Model/index'

// Vizs
type RESPONSE_VIZS = {
    id      : string,
    args    : {
        column_names    : string[]
    },
    contents    : string
}

type RESPONSE = {
    data: {
        success     : boolean
        lasts       : RESPONSE_VIZS[]
        message?    : string
        code?       : number
    }
}

export function VIZS(res:RESPONSE) {

    if (!res.data.success) {
        if (res.data.message === "None") {
            // パラメーターが指定されていない時
            throw new MessageModel({title: "情報", messageStatus: "info", code: res.data.code, message: "適切なパラメーターを指定してください。"})
        } else {
            // 
            throw new MessageModel({title: "描画エラー", messageStatus: "error", code: res.data.code, message:res.data.message})
        }
    }

    if (!res.data.lasts) {
        throw new MessageModel({title:"Jsonエラー", messageStatus: "error", code:res.data.code, message:res.data.message})
    }

    return res.data.lasts
}
