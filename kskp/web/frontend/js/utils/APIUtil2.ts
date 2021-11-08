
import {CommonResponse} from 'Modules/api/core/index';
import {FlowType} from "Model/index";

type ErrorResponse = {
    code: number;
    message: string;
};

export class APIUtil2 {

    // GET /flowsを発行してPromiseを返す
    static getFlow = (uuid: number): Promise<FlowType> => {
        // uuidが指定されない場合はAPIを発行しない
        if(!uuid){
            return new Promise<FlowType>(() => {});
        }

        return fetch('/api/v0/flows/' + uuid).then<CommonResponse<FlowType>>(
                res => res.json()
            ).then(
                json => {
                    if(json.success){
                        // データ取得が成功した場合
                        return json.data;
                    }else{
                        // 失敗した場合
                        // TODO: エラー発生時はHTTPのエラーコードを返すようにAPIを修正する予定
                        throw {code: json.code, message: json.message};
                    }
                }
            );
    };

    // POST /flowsを発行してPromiseを返す
    static postFlow = (parent: string, label:string, flow={}): Promise<FlowType> => {
        return fetch('/api/v0/flows',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            parent: parent,
                            label: label,
                            flow: flow
                        })
                    }
            ).then<CommonResponse<FlowType>>(
                res => res.json()
            ).then(
                json => {
                    if(json.success){
                        // データ取得が成功した場合
                        return json.data;
                    }else{
                        // 失敗した場合
                        throw {code: json.code, message: json.message};
                    }
                }
            );
    };

}