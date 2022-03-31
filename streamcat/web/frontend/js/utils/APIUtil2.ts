import {
    CommonResponse,
    DatumType,
    ParentProjectType,
    ParentFolderType,
    ParentTrashType,
    ProjectType,
    FolderType,
    TrashType,
    RemoteFolderType,
    DatabaseType,
    FlowType,
    ScheduleType,
    FrameType,
    DocumentType,
    ActivityType,
    Port,
    Flow,
    Command
} from 'Model/Library';
import {NavigationType, UserType} from 'Model/Navigation/NavigationModel';
import {LockType} from 'Model/Locks';


// NOTE: JavaScriptではJavaのようにcatch構文で例外オブジェクトに型に応じて処理を振り分ける事はできない
// その場合はcatch内で例外オブジェクトの型を判定する

// NOTE: instanceof演算子はオブジェクトの型の判定に使用されるが
// その右辺値にはtypeやinterfaceの型アノテーションは指定できない
// 代わりにClass等のprotptypeプロパティを保持するオブジェクトを指定する
// https://stackoverflow.com/questions/46703364
export class ErrorResponse {
    constructor(public code:number, public message:string) {
        this.code = code;
        this.message = message;
    }
}

/**
 * @param json
 * @throws {ErrorResponse}
 */
const unwrapJson = <TDatumType>(json: CommonResponse<TDatumType>):TDatumType => {
    if (json.success) {
        // データ取得が成功した場合
        return json.data;
    } else {
        // 失敗した場合
        // TODO: エラー発生時はHTTPのエラーコードを返すようにAPIを修正する予定
        throw new ErrorResponse(json.code || Number.NaN, json.message || '');
    }
}

/**
 * GET APIを発行する
 * @param url
 * @throws {ErrorResponse}
 */
const get = <TDatumType>(url: string, params?: {}) => {
    if(params) {
        url += '?' + Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    }
    return fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }
    ).then<CommonResponse<TDatumType>>(
        // fetch()はHTTPステータスコードがエラーでもrejectしない
        res => res.json()
    ).then(
        json => unwrapJson(json)
    );
}

/**
 * GET APIを発行する
 * @param url 
 */
 const download = (url: string, accept: string, fileName: string, params?: {}) => {
    if(params) {
        url += '?' + Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    }
    return fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Accept': accept
            }
        }
    ).then(
        res => res.blob()
    ).then(
        // Fetch API to force download file
        // https://stackoverflow.com/questions/44168090/fetch-api-to-force-download-file
        blob => {
            const href = window.URL.createObjectURL(blob);
            Object.assign(
                document.createElement('a'),
                {
                    href,
                    download: fileName
                }
            ).click();
        }
    );
}

/**
 * POST APIを発行する
 * @param url
 * @throws {ErrorResponse}
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
    ).then<TDatumType>(json => {
        const datum = unwrapJson(json)
        // DatumArrayのshift()を用いてdatumに各種関数を付与する
        return datum && (new DatumArray([datum as any])).shift();
    })
}

/**
 * PUT APIを発行する
 * @param url
 * @throws {ErrorResponse}
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
    ).then<TDatumType>(json => {
        const datum = unwrapJson(json)
        // DatumArrayのshift()を用いてdatumに各種関数を付与する
        return datum && (new DatumArray([datum as any])).shift();
    })
}

/**
 * DELETE APIを発行する
 * @param url
 * @throws {ErrorResponse}
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
const DatumArray = function(this: any, data: DatumType[]) {
    // NOTE: Arrow形式のコンストラクタ関数内ではthisを参照できない
    // NOTE: TypeScriptではコンストラクタ関数にはthis引数が必要のようだ
    // 
    // this: new DatumArray()で生成するオブジェクト
    Array.prototype.push.apply(this, data);
};

// DatumArrayはArrayオブジェクトを継承する
// Object.create: 指定したプロトタイプオブジェクトを持つオブジェクトを生成する
// NOTE: https://stackoverflow.com/questions/26630676
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
                // ProjectまたはFolderの直下にDatumを新規作成する関数群
                const d = datum as FolderType;
                d.createFolder = (label) =>
                    post<FolderType>(`/api/v0/folders`, {parent:d.uuid, label:label});
                d.createRemoteFolder = (label, protocol, hostname, domain, directory, userId, password) =>
                    post<RemoteFolderType>(`/api/v0/remote-folders`,
                                           {parent   : d.uuid,
                                            label    : label,
                                            protocol : protocol,
                                            hostname : hostname,
                                            domain   : domain,
                                            directory: directory,
                                            userId  : userId,
                                            password : password});
                d.createDatabase = (label, dbms, hostname, port, database, userId, password) =>
                    post<DatabaseType>(`/api/v0/databases`,
                                       {parent  : d.uuid,
                                        label   : label,
                                        dbms    : dbms,
                                        hostname: hostname,
                                        port    : port,
                                        database: database,
                                        userId : userId,
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

                if(datum.type === 'project') {
                    const d = datum as ParentProjectType;
                    d.move = (parent) => 
                        put<ProjectType>(`/api/v0/projects/${d.uuid}`, {parent:parent});
                    d.rename = (label) => 
                        put<ProjectType>(`/api/v0/projects/${d.uuid}`, {label:label});
                    d.delete = () =>
                        del(`/api/v0/projects/${d.uuid}`);
                    d.initMembers = (members, lastModifiedAt) =>
                        put<ParentProjectType>(`/api/v0/projects/${d.uuid}`, {members:members, lastModifiedAt:lastModifiedAt});
                }else if(datum.type === 'folder') {
                    const d = datum as ParentFolderType;
                    // プロジェクトはルート直下でしか作成できない
                    d.createProject = (label) =>
                        post<ProjectType>(`/api/v0/projects`, {parent:d.uuid, label:label});
                    d.move = (parent) => 
                        put<FolderType>(`/api/v0/folders/${d.uuid}`, {parent:parent});
                    d.rename = (label) => 
                        put<FolderType>(`/api/v0/folders/${d.uuid}`, {label:label});
                    d.delete = () =>
                        del(`/api/v0/folders/${d.uuid}`);
                }

            }else if(datum.type === 'trash') {
                const d = datum as TrashType;
                d.trashAll = () =>
                    del(`/api/v0/trashes`);
                d.putBack = (uuid) =>
                    put<TrashType>(`/api/v0/trashes/${uuid}`, {});
            }else if(datum.type === 'rfolder') {
                const d = datum as RemoteFolderType;
                d.move = (parent) => 
                    put<RemoteFolderType>(`/api/v0/remote-folders/${d.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<RemoteFolderType>(`/api/v0/remote-folders/${d.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/remote-folders/${d.uuid}`);
                d.update = (label, protocol, hostname, domain, directory, userId, password) =>
                    put<RemoteFolderType>(`/api/v0/remote-folders/${d.uuid}`,
                                          { label    : label,
                                            protocol : protocol,
                                            hostname : hostname,
                                            domain   : domain,
                                            directory: directory,
                                            userId   : userId,
                                            password : password});
            }else if(datum.type === 'database') {
                const d = datum as DatabaseType;
                d.move = (parent) => 
                    put<DatabaseType>(`/api/v0/databases/${d.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<DatabaseType>(`/api/v0/databases/${d.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/databases/${d.uuid}`);
                d.update = (label, dbms, hostname, port, database, userId, password) =>
                    put<DatabaseType>(`/api/v0/databases/${d.uuid}`,
                                      { label   : label,
                                        dbms    : dbms,
                                        hostname: hostname,
                                        port    : port,
                                        database: database,
                                        userId  : userId,
                                        password: password});
            }else if(datum.type === 'flow') {
                const d = datum as FlowType;
                d.move = (parent, lockUUID) => 
                    put<FlowType>(`/api/v0/flows/${d.uuid}`, {parent:parent, lock:lockUUID});
                d.rename = (label, lockUUID) => 
                    put<FlowType>(`/api/v0/flows/${d.uuid}`, {label:label, lock:lockUUID});
                d.delete = (lockUUID) =>
                    del(`/api/v0/flows/${d.uuid}`, {lock:lockUUID});
                d.update = (flow, lockUUID) =>
                    put<FlowType>(`/api/v0/flows/${d.uuid}`, {flow:flow, lock:lockUUID});
                d.updateLock = (editLock, lockUUID) =>
                    put<FlowType>(`/api/v0/flows/${d.uuid}`, {editLock:editLock, lock:lockUUID});
                d.duplicate = () =>
                    post(`/api/v0/flows`, {source:d.uuid});
            }else if(datum.type === 'schedule') {
                const d = datum as ScheduleType;
                d.move = (parent) => 
                    put<ScheduleType>(`/api/v0/schedules/${d.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<ScheduleType>(`/api/v0/schedules/${d.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/schedules/${d.uuid}`);
            }else if(datum.type === 'frame') {
                const d = datum as FrameType;
                d.move = (parent) => 
                    put<FrameType>(`/api/v0/frames/${d.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<FrameType>(`/api/v0/frames/${d.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/frames/${d.uuid}`);
            }else if(datum.type === 'document') {
                const d = datum as DocumentType;
                d.move = (parent) => 
                    put<DocumentType>(`/api/v0/documents/${d.uuid}`, {parent:parent});
                d.rename = (label) => 
                    put<DocumentType>(`/api/v0/documents/${d.uuid}`, {label:label});
                d.delete = () =>
                    del(`/api/v0/documents/${d.uuid}`);
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

DatumArray.prototype.find = function(callbackfn: (value: DatumType, index: number, array: DatumType[]) => boolean,
                                     thisArg?: any) {
    // this: new DatumArray()で生成するオブジェクト
    return DatumArray.prototype.map.apply(this, [datum => datum]).find(callbackfn, thisArg);
}

DatumArray.prototype.slice = function(start?: number, end?: number) {
    // this: new DatumArray()で生成するオブジェクト
    return DatumArray.prototype.map.apply(this, [datum => datum]).slice(start, end);
}

DatumArray.prototype.shift = function() {
    // this: new DatumArray()で生成するオブジェクト
    return DatumArray.prototype.map.apply(this, [datum => datum]).shift();
}

/**
 * UserにWebAPIを発行する関数を付与する
 * @param users Userのリスト
 */
 const UserArray = function(this: any, users: UserType[]) {
    // this: new UserArray()で生成するオブジェクト
    Array.prototype.push.apply(this, users);
};

// UserArrayはArrayオブジェクトを継承する
UserArray.prototype = Object.create(Array.prototype);
UserArray.prototype.constructor = UserArray;

// map関数をオーバーライドする
UserArray.prototype.map = function<U>(callbackfn: (user: UserType, index: number, array: UserType[]) => U,
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
        wrapCallbackfn = (user: UserType, index: number, array: UserType[]) => {
            //
            // Userオブジェクトに、WebAPIを発行する関数を付与する
            //
            user.rename = (name) => 
                put<UserType>(`/api/v0/users/${user.uuid}`, {name:name});
            user.updateEMail = (email) => 
                put<UserType>(`/api/v0/users/${user.uuid}`, {email:email});
            user.updatePassword = (password) => 
                put<UserType>(`/api/v0/users/${user.uuid}`, {password:password || null});
            user.undelete = () =>
                put<UserType>(`/api/v0/users/${user.uuid}`, {state:'active'});
            user.delete = () =>
                del(`/api/v0/users/${user.uuid}`);
            // map関数に渡されたコールバック関数を実行する
            return callbackfn(user, index, array);
        }
    }

    // Arrayのmapメソッドを、this=[UserArrayのインスタンス]で呼び出す
    return Array.prototype.map.apply(this, [wrapCallbackfn, thisArg]);
}

UserArray.prototype.shift = function() {
    return UserArray.prototype.map.apply(this, [user => user]).shift();
}

/**
 * PortArrayにhasPort関数を付与する
 */
const PortArray = function(this: any, ports: Port[]){
    Array.prototype.push.apply(this, ports);
}
PortArray.prototype = Object.create(Array.prototype);
PortArray.prototype.constructor = PortArray;

PortArray.prototype.hasPort = function(portId: string){
    // TODO: Portの識別子はnodeIdからlabelに変更予定
    return !!PortArray.prototype.find.apply(this, [p => p.nodeId === portId]);
}

PortArray.prototype.upsertPort = function(port: Port){
    const findPort = PortArray.prototype.find.apply(this, [p => p.nodeId === port.nodeId]);
    if(findPort){
        // 既に存在する場合は更新する
        findPort.label = port.label;
        findPort.type = port.type;
    }else{
        // 存在しない場合は追加する
        this.push(port);
    }
}

PortArray.prototype.removePort = function(portId: string){
    const index = PortArray.prototype.findIndex.apply(this, [p => p.nodeId === portId]);
    if(index === -1){
        // 存在しない場合は何もしない
        return;
    }
    // 存在する場合は削除する
    PortArray.prototype.splice.apply(this, [index, 1]);
}

// PortArrayをJSON文字列に変換する
PortArray.prototype.toJSON = function(){
    return PortArray.prototype.map.apply(this, [port => {return {...port};}]);
}

/**
 * Web APIを発行する関数を纏めるクラス
 */
export class APIUtil2 {

    /**
     * Web APIを発行せず、nullを返すPromiseを返す
     */
     static findNull = () => {
        return new Promise<null>(resolve => {
            // Promiseオブジェクトをfullfilled状態にする
            resolve(null);
        });
    }

    /**
     * GET /libraryを発行してルートフォルダを取得する
     * @throws {ErrorResponse}
     */
     static findLibrary = (members?: boolean) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {members?:string} = {};
        members && (params.members = 'on');
        return get<ParentFolderType>('/api/v0/library', params).then(folder => {
            folder = (new DatumArray([folder])).shift();
            folder.children = new DatumArray(folder.children);
            return folder;
        });
    };

    /**
     * GET /trashesを発行してゴミ箱を取得する
     * @throws {ErrorResponse}
     */
    static findTrash = () => {
        return get<ParentTrashType>('/api/v0/trashes').then(trash => {
            trash = (new DatumArray([trash])).shift();
            trash.children = new DatumArray(trash.children);
            return trash;
        });
    };

    /**
     * GET /projectsを発行して全てのプロジェクトを取得する
     * @throws {ErrorResponse}
     */
    static findProjects = (onRoot?: boolean, exceptMyProject?: boolean, members?: boolean):Promise<ProjectType[]> => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {on_root?:string, except_myproject?:string, members?:string} = {};
        onRoot && (params.on_root = 'on');
        exceptMyProject && (params.except_myproject = 'on');
        members && (params.members = 'on');
        return get<ProjectType[]>('/api/v0/projects', params).then(projects => {
            return new DatumArray(projects);
        });
    };

    /**
     * GET /projectsを発行してプロジェクトを取得する
     * @param uuid 取得するプロジェクトのUUID
     * @throws {ErrorResponse}
     */
    static findProject = (uuid: string, members?: boolean) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {members?:string} = {};
        members && (params.members = 'on');
        return get<ParentProjectType>(`/api/v0/projects/${uuid}`, params).then(project => {
            project = (new DatumArray([project])).shift();
            project.children = new DatumArray(project.children);
            return project;
        });
    };

    /**
     * GET /foldersを発行してフォルダを取得する
     * @param uuid 取得するフォルダのUUID
     * @throws {ErrorResponse}
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
     * @throws {ErrorResponse}
     */
    static findFlow = (uuid: string) => {
        return get<FlowType>(`/api/v0/flows/${uuid}`).then(flow => {
            flow = (new DatumArray([flow])).shift();
            const flowJson = flow.flow;
            // 配列プロパティがない場合は空値を格納する
            if(!flowJson.nodes){
                flowJson.nodes = [];
            }
            if(!flowJson.params){
                flowJson.params = [];
            }
            if(!flowJson.ports){
                flowJson.ports =[new PortArray([]), new PortArray([])];
            }else if(flow.flow.ports.length === 2) {
                flowJson.ports[0] = new PortArray(flowJson.ports[0]);
                flowJson.ports[1] = new PortArray(flowJson.ports[1]);
            }
            return flow;
        });
    };

    /**
     * GET /archives/flowsを発行してフローのファイルを取得する
     * @param uuid 取得するフローまたはフォルダのUUID
     */
    static downloadFlow = (uuid: string, label: string) => {
        const accept = `application/gzip`;
        const fileName = label + '.tgz';
        return download(`/api/v0/archives/flows/${uuid}`, accept, fileName);
    };

    /**
     * GET /framesを発行してフレームを取得する
     * @param uuid 取得するフレームのUUID
     * @throws {ErrorResponse}
     */
    static findFrame = (uuid: string, contents?: boolean, offset?: number, limit?: number) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {contents?:string, offset?:number, limit?:number} = {};
        contents && (params.contents = 'on');
        offset && (params.offset = offset);
        limit && (params.limit = limit);
        return get<FrameType>(`/api/v0/frames/${uuid}`, params).then(frame => {
            frame = (new DatumArray([frame])).shift();
            return frame;
        });
    };

    /**
     * GET /framesを発行してフレームのファイルを取得する
     * @param uuid 取得するフレームのUUID
     */
     static downloadFrame = (uuid: string, label: string, encoding?: string) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        const params = {contents:true};
        const accept = `text/csv; charset=${encoding||'utf-8'}`;
        // ダウンロードファイル名を作成する
        let fileName: string;;
        if(label.endsWith('.csv') || label.endsWith('.txt')){
            fileName = label;
        }else{
            fileName = label + '.csv';
        }
        return download(`/api/v0/frames/${uuid}`, accept, fileName, params);
    };

    /**
     * GET /subflowsを発行してサブフローを取得する
     * @throws {ErrorResponse}
     */
    static findSubflows = () => {
        return get<Flow[]>('/api/v0/subflows');
    };

    /**
     * GET /datasrcsを発行してデータソースを取得する
     * @throws {ErrorResponse}
     */
    static findDataSrcs = () => {
        return get<Flow[]>('/api/v0/datasrcs');
    };

    /**
     * GET /datadstsを発行してデータデストを取得する
     * @throws {ErrorResponse}
     */
    static findDataDsts = () => {
        return get<Flow[]>('/api/v0/datadsts');
    };

    /**
     * GET /commandsを発行してCommandを取得する
     * @throws {ErrorResponse}
     */
    static findCommands = () => {
        return get<Command[]>('/api/v0/commands');
    };

    /**
     * GET /vcommandsを発行してVCommandを取得する
     * @throws {ErrorResponse}
     */
    static findVCommands = () => {
        return get<Command[]>('/api/v0/vcommands');
    };

    /**
     * GET /navigationを発行してNavigationを取得する
     * @throws {ErrorResponse}
     */
    static findNavigation = () => {
        return get<NavigationType>('/api/v0/navigation');
    }

    /**
     * POST /locksを発行してロックを獲得する
     * @param flowUUID 排他ロック対象Datumのuuid
     * @throws {ErrorResponse}
     */
    static createLock = (flowUUID: string, lastModifiedAt?: string) => {
        // lastModifiedAtが指定された場合はロックの再取得をする
        let body: {target:string, lastModifiedAt?:string} = {target: flowUUID};
        lastModifiedAt && (body.lastModifiedAt = lastModifiedAt);
        return post<LockType>('/api/v0/locks', body).then(lock => {
            lock.extend = () =>
                put(`/api/v0/locks/${lock.uuid}`, {});
            lock.delete = () =>
                del(`/api/v0/locks/${lock.uuid}`, {});
            return lock;
        });
    }

    /**
     * POST /vizsを発行してフローをプレビューする
     * @param flowUUID
     * @throws {ErrorResponse}
     */
    static createFlowVis = (flowUUID:string, args:{}, lockUUID?:string) => {
        const body = {uuid:flowUUID, args:args, lock:lockUUID};
        return post<ActivityType>('/api/v0/vizs', body);
    }

    /**
     * POST /vizsを発行してFrameをプレビューする
     * @param flowUUID
     * @throws {ErrorResponse}
     */
    static createFrameVis = (frameUUID:string, args:{}) => {
        const body = {frame:frameUUID, args:args};
        return post<ActivityType>('/api/v0/vizs', body);
    }

    /**
     * POST /activitiesを発行してフローを実行する
     * @param flowUUID
     * @throws {ErrorResponse}
     */
    static createActivity = (flowUUID:string, args:{}, lockUUID?:string) => {
        const body = {uuid:flowUUID, args:args, lock:lockUUID};
        return post<ActivityType>('/api/v0/activities', body);
    };

    /**
     * GET /usersを発行してUserを取得する
     * @throws {ErrorResponse}
     */
     static findUsers = (q?: string, exceptInactive?:boolean, roles?: boolean, projects?: boolean):Promise<UserType[]>  => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {q?:string, except_inactive?:string, roles?:string, projects?:string} = {};
        q && (params.q = q);
        exceptInactive && (params.except_inactive = 'on');
        roles && (params.roles = 'on');
        projects && (params.projects = 'on');
        return get<UserType[]>('/api/v0/users', params).then(users => {
            return new UserArray(users);
        });
    }
}
