
import {CommonResponse} from 'Modules/api/core/index';
import {FlowType} from "Model/index";

type ErrorResponse = {
    code: number;
    message: string;
};

/**
 * Web APIを発行する関数を纏めるクラス
 */
export class APIUtil2 {

    /**
     * GET /flowsを発行してフローを取得する
     * @param uuid 取得するフローのUUID
     */
    static getFlow = (uuid: string): Promise<FlowType> => {
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

    /**
     * POST /flowsを発行してフローを新規作成する
     * @param parent 新規作成するフローの親フォルダのUUID
     * @param label 新規作成するフローのラベル名
     * @param flow 新規作成するフローのJSON
     */
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