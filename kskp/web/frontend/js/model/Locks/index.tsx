type post_locks_response = {
    data : {
        success : boolean,
        data : {
            uuid : string
        } | undefined
        code : number | undefined,
        message : string  | undefined;
    } 
}


type Props =  {
    target : string // flowUUID
}

// 排他制御のためなモデル
export default class LocksModel {
    success: boolean | undefined;
    target : string;
    lockId : string | undefined;
    error  : {
        code : number | undefined;
        message : string | undefined;
    } | undefined
    
    constructor(props:Props) {
        this.target = props.target
    }
    
    Parse(data:post_locks_response):LocksModel {
        try {
            if (!data.data) throw "faild Parsing Data With undefined response.data(Post Locks Response)"
            let responseData = data.data

            this.success = responseData.success
            if (this.success) {
                this.lockId = (responseData.data) ? responseData.data.uuid : undefined
            } else {
                this.error = {
                    code : responseData.code,
                    message : responseData.message
                }
            }
        } catch(e) {
            console.log(e)
        } finally {
            return this
        }
    }

    getLockId():undefined | string {
        return this.lockId
    }

    hasLock():boolean {
        return (this.lockId) ? true : false
    }

    getErrorMessage():undefined | string {
        let result:any = undefined
        if (this.error && this.error.message) result = this.error.message

        return result
    }

    StatusText():string {
        let result:string = ""

        try {
            result = "Flowの編集が可能な状態です。"
            if(this.success == false && this.error && this.error.message) {
                result = this.error.message
            }
        } catch(e) {
            console.log(e)
        } 
        
        return result
    }
}
