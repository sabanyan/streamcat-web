export type Props = {
    title?: string
    code?: number
    message?: string 
    messageStatus?: string
}

export default class Error {
    title?: string
    code?: number
    message?: string
    messageStatus?: string 

    constructor(props?:Props) {
        if(!props) return
        this.title  = props.title ? props.title : ""
        this.code   = props.code
        this.message = props.message
        this.messageStatus =  props.messageStatus

        this.parseStatus(this.code)
    }

    parseStatus(code:number = 0) {
        if (this.messageStatus) return

        if (-4 <= code && code <= -3){
            this.messageStatus = "warning"
            this.title = "警告"
        } else {
            this.messageStatus = "error"
            this.title = "エラー"
        }
    }
}