
import {CommonResponse} from 'Modules/api/core/index';
import {
    DatumType,
    ParentProjectType,
    ParentFolderType,
    ProjectType,
    FolderType,
    RemoteFolderType,
    DatabaseType,
    FlowType,
    ScheduleType,
    FrameType,
    DocumentType
} from 'Model/Library';
import {
    NavigationType
} from 'Model/Navigation/NavigationModel';

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
 * GET APIを発行する
 * @param url 
 */
const get = <TDatumType>(url: string) => {
    return fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }
    ).then<CommonResponse<TDatumType>>(
        res => res.json()
    ).then(
        json => unwrapJson(json)
    );
}

/**
 * POST APIを発行する
 * @param url 
 */
const post = <TDatumType>(url: string, body: {}) => {
    return fetch(
        url,
        {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    ).then<CommonResponse<TDatumType>>(
        res => res.json()
    ).then(
        json => unwrapJson(json)
    )
}

/**
 * PUT APIを発行する
 * @param url 
 */
const put = <TDatumType>(url: string, body: {}) => {
    return fetch(
        url,
        {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    ).then<CommonResponse<TDatumType>>(
        res => res.json()
    ).then(
        json => unwrapJson(json)
    )
}

/**
 * DELETE APIを発行する
 * @param url 
 */
const del = (url: string, body={}) => {
    return fetch(
        url,
        {
            method: 'DELETE',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    ).then<CommonResponse<void>>(
        res => res.json()
    ).then(
        json => unwrapJson(json)
    );
}


/**
 * DatumにWebAPIを発行する関数を付与する
 * @param data Datumのリスト
 */
const DatumArray = function (this: any, data: DatumType[]) {
    // NOTE: Arrow形式のコンストラクタ関数内ではthisを参照できない
    // NOTE: TypeScriptではコンストラクタ関数にはthis引数が必要のようだ
    // 
    // this: new DatumArray()で生成するオブジェクト
    Array.prototype.push.apply(this, data);
};

// DatumArrayはArrayオブジェクトを継承する
// Object.create: 指定したプロトタイプオブジェクトを持つオブジェクトを生成する
DatumArray.prototype = Object.create(Array.prototype);
DatumArray.prototype.constructor = DatumArray;

// map関数をオーバーライドする
// map関数でDatumのリストをイテレートする時に、WebAPIを発行する関数を付与する
// こうすることで無駄にDatumのリストをイテレートするのを防ぐ
DatumArray.prototype.map = function<U>(callbackfn: (datum: DatumType, index: number, array: DatumType[]) => U,
                                       thisArg?: any) : any {
    // Arrayのmap関数に渡すコールバック関数
    let wrapCallbackfn;

    if(this.__isWrapped) {
        // 既にラッパー処理済みの場合は何もしない
        wrapCallbackfn = callbackfn;
    }else{
        // 未ラッパーの場合はラッパー処理を行う
        this.__isWrapped = true;

        // ラッパー処理をする関数を作成する
        wrapCallbackfn = (datum: DatumType, index: number, array: DatumType[]) => {
            // 
            // Datumオブジェクトに、種別に従ってWebAPIを発行する関数を付与する
            // 
            if(datum.type === 'project' || datum.type === 'folder') {
                if(datum.type === 'project') {
                    const d = datum as ParentProjectType;
                    d.move = (parent) => 
                        put<ProjectType>(`/api/v0/projects/${datum.uuid}`, {parent:parent});
                    d.rename = (label) => 
                        put<ProjectType>(`/api/v0/projects/${datum.uuid}`, {label:label});
                    d.delete = () =>
                        del(`/api/v0/projects/${datum.uuid}`);
                    d.initMembers = (members, lastModifiedAt) =>
                        put<ParentProjectType>(`/api/v0/projects/${datum.uuid}`, {members:members, lastModifiedAt:lastModifiedAt});
                }else if(datum.type === 'folder') {
                    const d = datum as ParentFolderType;
                    d.move = (parent) => 
                        put<FolderType>(`/api/v0/folders/${datum.uuid}`, {parent:parent});
                    d.rename = (label) => 
                        put<FolderType>(`/api/v0/folders/${datum.uuid}`, {label:label});
                    d.delete = () =>
                        del(`/api/v0/folders/${datum.uuid}`);
                }
                // ProjectまたはFolderの直下にDatumを新規作成する関数群
                const d = datum as FolderType;
                d.createFolder = (label) =>
                    post<FolderType>(`/api/v0/folders`, {parent:d.uuid, label:label});
                d.createRemoteFolder = (label, protocol, hostname, domain, directory, user_id, password) =>
                    post<RemoteFolderType>(`/api/v0/remote_folders`,
                                           {parent   : d.uuid,
                                            label    : label,
                                            protocol : protocol,
                                            hostname : hostname,
                                            domain   : domain,
                                            directory: directory,
                                            user_id  : user_id,
                                            password : password});
                d.createDatabase = (label, dbms, hostname, port, database, user_id, password) =>
                    post<DatabaseType>(`/api/v0/databases`,
                                       {parent  : d.uuid,
                                        label   : label,
                                        dbms    : dbms,
                                        hostname: hostname,
                                        port    : port,
                                        database: database,
                                        user_id : user_id,
                                        password: password});
                d.createFlow = (label, flow={}) =>
                    post<FlowType>(`/api/v0/flows`,
                                   {parent: d.uuid,
                                    label : label,
                                    flow  : flow});
                d.createSchedule = (label, runnableUUID, args, inputs, trigger) =>
                    post<ScheduleType>(`/api/v0/schedules`,
                                       {parent : d.uuid,
                                        label  : label,
                                        runnableUUID: runnableUUID,
                                        args   : args,
                                        inputs : inputs,
                                        trigger: trigger});
                d.createFrame = (label, file) =>
                    post<FrameType>(`/api/v0/frames`,
                                    {parent: d.uuid,
                                     label : label,
                                     file  : file});
                d.createDocument = (label, file) =>
                    post<DocumentType>(`/api/v0/documents`,
                                       {parent: d.uuid,
                                        label : label,
                                        file  : file});

            }else if(datum.type === 'trash') {
                const d = datum as ParentFolderType;
                d.delete = () =>
                    del(`/api/v0/trashes/${datum.uuid}`);
            }else if(datum.type === 'rfolder') {
                const d = datum as RemoteFolderType;
                d.move = (parent) => 
                    put<RemoteFolderType>(`/api/v0/remote-folders/${datum.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<RemoteFolderType>(`/api/v0/remote-folders/${datum.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/remote-folders/${datum.uuid}`);
            }else if(datum.type === 'database') {
                const d = datum as DatabaseType;
                d.move = (parent) => 
                    put<DatabaseType>(`/api/v0/databases/${datum.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<DatabaseType>(`/api/v0/databases/${datum.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/databases/${datum.uuid}`);
            }else if(datum.type === 'flow') {
                const d = datum as FlowType;
                d.move = (parent) => 
                    put<FlowType>(`/api/v0/flows/${datum.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<FlowType>(`/api/v0/flows/${datum.uuid}`, {label:label});
                d.delete = (lockUUID) =>
                    del(`/api/v0/flows/${datum.uuid}`, {lock:lockUUID});
            }else if(datum.type === 'schedule') {
                const d = datum as ScheduleType;
                d.move = (parent) => 
                    put<ScheduleType>(`/api/v0/schedules/${datum.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<ScheduleType>(`/api/v0/schedules/${datum.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/schedules/${datum.uuid}`);
            }else if(datum.type === 'frame') {
                const d = datum as FrameType;
                d.move = (parent) => 
                    put<FrameType>(`/api/v0/frames/${datum.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<FrameType>(`/api/v0/frames/${datum.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/frames/${datum.uuid}`);
            }else if(datum.type === 'document') {
                const d = datum as DocumentType;
                d.move = (parent) => 
                    put<DocumentType>(`/api/v0/documents/${datum.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<DocumentType>(`/api/v0/documents/${datum.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/documents/${datum.uuid}`);
            }else if(datum.type === 'activity') {
                // Activityの変更・削除はできない
            }
            // map関数に渡されたコールバック関数を実行する
            return callbackfn(datum, index, array);
        }
    }
    
    // Arrayのmapメソッドを、this=[DatumArrayのインスタンス]で呼び出す
    // NOTE: TypeScriptにargumentsキーワードは存在しない
    return Array.prototype.map.apply(this, [wrapCallbackfn, thisArg]);
}

DatumArray.prototype.slice = function(start?: number, end?: number)  {
    // this: new DatumArray()で生成するオブジェクト
    return DatumArray.prototype.map.apply(this, [datum => datum]).slice(start, end);
}

DatumArray.prototype.shift = function() {
    // this: new DatumArray()で生成するオブジェクト
    return DatumArray.prototype.map.apply(this, [datum => datum]).shift();
}


/**
 * Web APIを発行する関数を纏めるクラス
 */
export class APIUtil2 {
    /**
     * GET /libraryを発行してルートフォルダを取得する
     */
     static findLibrary = () => {
        return get<ParentFolderType>('/api/v0/libray').then(folder => {
            folder = (new DatumArray([folder])).shift();
            folder.children = new DatumArray(folder.children);
            return folder;
        });
    };

    /**
     * GET /trashesを発行してゴミ箱を取得する
     */
    static findTrash = () => {
        return get<ParentFolderType>('/api/v0/trashes');
    };

    /**
     * GET /projectsを発行してプロジェクトを取得する
     * @param uuid 取得するプロジェクトのUUID
     */
    static findProject = (uuid: string) => {
        return get<ParentProjectType>(`/api/v0/projects/${uuid}`).then(project => {
            project = (new DatumArray([project])).shift();
            project.children = new DatumArray(project.children);
            return project;
        });
    };

    /**
     * GET /foldersを発行してフォルダを取得する
     * @param uuid 取得するフォルダのUUID
     */
     static findFolder = (uuid: string) => {
        return get<ParentFolderType>(`/api/v0/folders/${uuid}`).then(folder => {
            folder = (new DatumArray([folder])).shift();
            folder.children = new DatumArray(folder.children);
            return folder;
        });
    };

    /**
     * GET /flowsを発行してフローを取得する
     * @param uuid 取得するフローのUUID
     */
    static findFlow = (uuid: string) => {
        return get<FlowType>(`/api/v0/flows/${uuid}`).then(flow => {
            flow = (new DatumArray([flow])).shift();
            return flow;
        });
    };

    /**
     * GET /navigationを発行してNavigationを取得する
     */
    static findNavigation = () => {
        return get<NavigationType>('/api/v0/navigation');
    }

    /**
     * Web APIを発行せず、nullを返すPromiseを返す
     */
    static findNull = () => {
        return new Promise<null>(resolve => {
            // Promiseオブジェクトをfullfilled状態にする
            resolve(null);
        });
    }
}
