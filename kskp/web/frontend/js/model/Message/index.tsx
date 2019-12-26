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

    constructor(props:Props) {
        this.title  = props.title
        this.code   = props.code
        this.message = props.message
        this.messageStatus = (props.messageStatus) ? props.messageStatus : "error"
    }
}