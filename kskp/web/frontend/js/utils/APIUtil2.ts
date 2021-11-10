
import {CommonResponse} from 'Modules/api/core/index';
import {ParentProjectType, ParentFolderType, FlowType} from "Model/index";

type ErrorResponse = {
    code: number;
    message: string;
};

 const unwrapJson = <TDatumType>(json: CommonResponse<TDatumType>):TDatumType => {
    if (json.success) {
        // データ取得が成功した場合
        return json.data;
    } else {
        // 失敗した場合
        // TODO: エラー発生時はHTTPのエラーコードを返すようにAPIを修正する予定
        throw {code: json.code, message: json.message};
    }
}

/**
 * Web APIを発行する関数を纏めるクラス
 */
export class APIUtil2 {


    /**
     * GET /projectsを発行してプロジェクトを取得する
     * @param uuid 取得するプロジェクトのUUID
     */
    static getProject = (uuid: string): Promise<ParentProjectType> => {
        // uuidが指定されない場合はAPIを発行しない
        if(!uuid){
            return new Promise<ParentProjectType>(() => {});
        }

        return fetch('/api/v0/projects/' + uuid).then<CommonResponse<ParentProjectType>>(
                res => res.json()
            ).then(
                json => unwrapJson(json)
            );
    };

    /**
     * GET /foldersを発行してフォルダを取得する
     * @param uuid 取得するフォルダのUUID
     */
     static getFolder = (uuid: string): Promise<ParentFolderType> => {
        // uuidが指定されない場合はAPIを発行しない
        if(!uuid){
            return new Promise<ParentFolderType>(() => {});
        }

        return fetch('/api/v0/projects/' + uuid).then<CommonResponse<ParentFolderType>>(
                res => res.json()
            ).then(
                json => unwrapJson(json)
            );
    };
    
    /**
     * GET /trashesを発行してゴミ箱を取得する
     * @param uuid 取得するゴミ箱のUUID
     */
     static getTrash = (uuid: string): Promise<ParentFolderType> => {
        // uuidが指定されない場合はAPIを発行しない
        if(!uuid){
            return new Promise<ParentFolderType>(() => {});
        }

        return fetch('/api/v0/trashes/' + uuid).then<CommonResponse<ParentFolderType>>(
                res => res.json()
            ).then(
                json => unwrapJson(json)
            );
    };

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
                json => unwrapJson(json)
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
                json => unwrapJson(json)
            );
    };

}