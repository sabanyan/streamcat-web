import {
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
import {
    ConnectivityType,
    NavigationType
} from 'Model/Navigation/NavigationModel';
import {
    CommandNodeType,
    FrameNodeType,
    NodeType,
    NoteNodeType,
    calcSize
} from 'Model/Step/NodeTypes';
import {
    toJsonOrRaise,
    getBase as get,
    postBase,
    putBase,
    delBase,
    makeArrayCtor
} from './ApiBase';

const post = <TDatumType>(url: string, body: {}) => {
    return postBase<TDatumType>(url, body).then<TDatumType>(datum => {
        // DatumArrayのshift()を用いてdatumに各種関数を付与する
        return datum && (new DatumArray([datum as any])).shift() as any;
    });
};

const put = <TDatumType>(url: string, body: {}) => {
    return putBase<TDatumType>(url, body).then<TDatumType>(datum => {
        // DatumArrayのshift()を用いてdatumに各種関数を付与する
        return datum && (new DatumArray([datum as any])).shift() as any;
    });
};

const del = <TDatumType>(url: string, body={}) => {
    return delBase<TDatumType>(url, body).then<TDatumType>(datum => {
        // DatumArrayのshift()を用いてdatumに各種関数を付与する
        return datum && (new DatumArray([datum as any])).shift() as any;
    });
};

/**
 * GET APIを発行してファイルをダウンロードする
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
};

/**
 * POST APIを発行してファイルをアップロードする
 * @param url
 * @throws {ErrorResponse}
 */
const upload = <TDatumType>(url:string, body:{}) => {
    // FormDataオブジェクトにAPIパラメタを格納する
    const formData = new FormData();
    for(const key in body){
        formData.append(key, body[key])
    };
    return fetch(
        url,
        {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
                // Content-Typeを指定するとAPI発行に失敗する
            }
        }
    ).then<TDatumType>(
        json => toJsonOrRaise(json)
    ).then(datum => {
        // DatumArrayのshift()を用いてdatumに各種関数を付与する
        return datum && (new DatumArray([datum as any])).shift() as any;
    });
};

/**
 * DatumArrayのコンストラクタ関数を作成する
 */
const DatumArray = makeArrayCtor<DatumType>(datum => {
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
                                {parent  : d.uuid,
                                label   : label,
                                runnable: runnableUUID,
                                args    : args,
                                inputs  : inputs,
                                trigger : trigger});
        d.createFrame = (label, file) =>
            upload<FrameType>(`/api/v0/frames`,
                                {parent: d.uuid,
                                label : label,
                                file  : file});
        d.createDocument = (label, file) =>
            upload<DocumentType>(`/api/v0/documents`,
                                    {parent: d.uuid,
                                    label : label,
                                    file  : file});
        d.uploadFlow = (label, file) =>
            upload<void>(`/api/v0/archives/flows`,
                            {parent: d.uuid,
                            label : label,
                            file  : file});

        if(datum.type === 'project') {
            const d = datum as ParentProjectType;
            d.move = (parent) => 
                put<ProjectType>(`/api/v0/projects/${d.uuid}`, {parent:parent});
            d.rename = (label) => 
                put<ProjectType>(`/api/v0/projects/${d.uuid}`, {label:label});
            d.duplicate = () =>
                post(`/api/v0/folders`, {source:d.uuid});
            d.delete = () =>
                del<ProjectType>(`/api/v0/projects/${d.uuid}`);
            d.initMembers = (members, lastModifiedAt) =>
                put<ParentProjectType>(`/api/v0/projects/${d.uuid}`, {members:members, lastModifiedAt:lastModifiedAt});
            d.joinMember = (member) =>
                put<void>(`/api/v0/projects/${d.uuid}/users/${member.uuid}`, {memberType:member.type});
        }else if(datum.type === 'folder') {
            const d = datum as ParentFolderType;
            // プロジェクトはルート直下でしか作成できない
            d.createProject = (label) =>
                post<ProjectType>(`/api/v0/projects`, {parent:d.uuid, label:label});
            d.move = (parent) => 
                put<FolderType>(`/api/v0/folders/${d.uuid}`, {parent:parent});
            d.rename = (label) => 
                put<FolderType>(`/api/v0/folders/${d.uuid}`, {label:label});
            d.duplicate = () =>
                post(`/api/v0/folders`, {source:d.uuid});
            d.delete = () =>
                del<FolderType>(`/api/v0/folders/${d.uuid}`);
        }

    }else if(datum.type === 'trash') {
        const d = datum as TrashType;
        d.trashAll = () =>
            del<void>(`/api/v0/trashes`);
        d.putBack = (uuid) =>
            put<TrashType>(`/api/v0/trashes/${uuid}`, {});
    }else if(datum.type === 'rfolder') {
        const d = datum as RemoteFolderType;
        d.move = (parent) => 
            put<RemoteFolderType>(`/api/v0/remote-folders/${d.uuid}`, {parent:parent});
        d.rename = (label) => 
            put<RemoteFolderType>(`/api/v0/remote-folders/${d.uuid}`, {label:label});
        d.duplicate = () =>
            post(`/api/v0/remote-folders`, {source:d.uuid});
        d.delete = () =>
            del<RemoteFolderType>(`/api/v0/remote-folders/${d.uuid}`);
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
        d.duplicate = () =>
            post(`/api/v0/databases`, {source:d.uuid});
        d.delete = () =>
            del<DatabaseType>(`/api/v0/databases/${d.uuid}`);
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
            del<FlowType>(`/api/v0/flows/${d.uuid}`, {lock:lockUUID});
        d.update = (flow, lockUUID) =>
            put<FlowType>(`/api/v0/flows/${d.uuid}`, {flow:flow, lock:lockUUID});
        d.updateLock = (editLock, lockUUID) =>
            put<FlowType>(`/api/v0/flows/${d.uuid}`, {editLock:editLock, lock:lockUUID});
        d.duplicate = () =>
            post(`/api/v0/flows`, {source:d.uuid});
        d.deleteCache = (nodeId) =>
            del<void>(`/api/v0/caches?of=${d.uuid}.${nodeId}`);
    }else if(datum.type === 'schedule') {
        const d = datum as ScheduleType;
        d.move = (parent) => 
            put<ScheduleType>(`/api/v0/schedules/${d.uuid}`, {parent:parent});
        d.rename = (label) => 
            put<ScheduleType>(`/api/v0/schedules/${d.uuid}`, {label:label});
        d.duplicate = () =>
            post(`/api/v0/schedules`, {source:d.uuid});
        d.delete = () =>
            del<ScheduleType>(`/api/v0/schedules/${d.uuid}`);
        d.update = (label, runnableUUID, args, inputs, trigger) =>
            put<ScheduleType>(`/api/v0/schedules/${d.uuid}`,
                                { label   : label,
                                runnable: runnableUUID,
                                args    : args,
                                inputs  : inputs,
                                trigger : trigger});
    }else if(datum.type === 'frame') {
        const d = datum as FrameType;
        d.move = (parent) => 
            put<FrameType>(`/api/v0/frames/${d.uuid}`, {parent:parent});
        d.rename = (label) => 
            put<FrameType>(`/api/v0/frames/${d.uuid}`, {label:label});
        d.duplicate = () =>
            post(`/api/v0/frames`, {source:d.uuid});
        d.delete = () =>
            del<FrameType>(`/api/v0/frames/${d.uuid}`);
        d.update = (encoding, newline) =>
            put<FrameType>(`/api/v0/frames/${d.uuid}`,
                            { encoding: encoding,
                            newline : newline});
    }else if(datum.type === 'document') {
        const d = datum as DocumentType;
        d.move = (parent) => 
            put<DocumentType>(`/api/v0/documents/${d.uuid}`, {parent:parent});
        d.rename = (label) => 
            put<DocumentType>(`/api/v0/documents/${d.uuid}`, {label:label});
        d.duplicate = () =>
            post(`/api/v0/documents`, {source:d.uuid});
        d.delete = () =>
            del<DocumentType>(`/api/v0/documents/${d.uuid}`);
    }else if(datum.type === 'activity') {
        // Activityの変更・削除はできない
    }
});

/**
 * NodeArrayのコンストラクタ関数を作成する
 */
const NodeArray = makeArrayCtor<NodeType>(node => {
    if(node.type === 'frame'){
        const n = node as FrameNodeType;
        n.hasData = () => !!n.uuid;
        n.isCached = () => !!n.cacheCreatedAt;
        n.deleteCache = () => {
            n.cacheCreatedAt = null;
            n.uuid = null;
        };
    }else if(node.type === 'command'){
        const c = node as CommandNodeType;
        c.deleteInPort = (label:string) => {
            c.srcs && delete c.srcs[label];
            if(c.srcsOrder){
                c.srcsOrder = c.srcsOrder.filter(srcLabel => srcLabel !== label);
            }
        };
        c.addInPort = (label:string, nodeId:string) => {
            if(!c.srcs){
                c.srcs = {};
            }
            c.srcs[label] = nodeId;
            if(!c.srcsOrder){
                c.srcsOrder = [];
            }
            c.srcsOrder.push(label);
        };
        c.getInPortIndex = () => {
            const srcKeys = Object.keys(c.srcs || {});

            const filterKeys = srcKeys.filter((key) => {
                return (key.indexOf("*") != -1);
            });
    
            let max = 0;
            filterKeys.forEach((key) => {
                const value = key.replace("*", "");
                max = (parseInt(value) > max) ? parseInt(value) : max;
            });
    
            return max;
        };
        c.addableInPort = () => {
            // コマンドが複数入力可能かどうかを判断するため、元のコマンドのInPort定義に＊があるか確認する
            const filterKeys = c.getCommand().ports[0].filter((inPort) => {
                return (inPort.label.indexOf("*") >= 0);
            });
            return filterKeys.length > 0;
        };
        c.getCommand = () => {
            const commands = (window as any).commands;
            return commands.find(command => command.id === c.commandId);
        };
    }else if(node.type === 'note'){
        const n = node as NoteNodeType;
        n.setTitle = (title) => {
            n.title = title;
            n.size = calcSize(title, n.fontSize || 16);
        };
        n.setFontSize = (fontSize) => {
            n.fontSize = fontSize;
            n.size = calcSize(n.title, fontSize);
        };
    }else{
        // TODO: 他のNodeTpeを追加予定
    }
});

/**
 * PortArrayのコンストラクタ関数を作成する
 */
const PortArray = function(this: any, ports: Port[]){
    Array.prototype.push.apply(this, ports);
}
PortArray.prototype = Object.create(Array.prototype);
PortArray.prototype.constructor = PortArray;

PortArray.prototype.exists = function(portId: string){
    // TODO: Portの識別子はnodeIdからlabelに変更予定
    return !!PortArray.prototype.find.apply(this, [p => p.nodeId === portId]);
}

PortArray.prototype.upsert = function(port: Port){
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

PortArray.prototype.removeByNodeId = function(nodeId: string){
    const index = PortArray.prototype.findIndex.apply(this, [p => p.nodeId === nodeId]);
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
 * 引数を追加する共通関数
 */
const addOffsetLimit = (params:{offset?:number,limit?:number}, offset?:number, limit?:number) => {
    // offset==0の場合はoffsetパラメタを指定しない
    offset && (params.offset = offset);
    // limit==0の場合はlimitパラメタを指定する
    limit != null && (params.limit = limit);
};

/**
 * Web APIを発行する関数を纏めるクラス
 */
export const DatumApi = {

    /**
     * Web APIを発行せず、nullを返すPromiseを返す
     */
    findNull: () => {
        return new Promise<null>(resolve => {
            // Promiseオブジェクトをfullfilled状態にする
            resolve(null);
        });
    },

    /**
     * Web APIを発行せず、[]を返すPromiseを返す
     */
    findEmpty: () => {
        return new Promise<[]>(resolve => {
            // Promiseオブジェクトをfullfilled状態にする
            resolve([]);
        });
    },

    /**
     * GET /libraryを発行してルートフォルダを取得する
     * @throws {ErrorResponse}
     */
    findLibrary: (offset?:number, limit?:number, members?: boolean) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {offset?:number, limit?:number, members?:string} = {};
        addOffsetLimit(params, offset, limit);
        members && (params.members = 'on');
        return get<ParentFolderType>('/api/v0/library', params).then(folder => {
            folder = (new DatumArray([folder])).shift() as any;
            folder.children = new DatumArray(folder.children);
            return folder;
        });
    },

    /**
     * GET /trashesを発行してゴミ箱を取得する
     * @throws {ErrorResponse}
     */
    findTrash: (offset?:number, limit?:number) => {
        let params: {offset?:number, limit?:number} = {};
        addOffsetLimit(params, offset, limit);
        return get<ParentTrashType>('/api/v0/trashes', params).then(trash => {
            trash = (new DatumArray([trash])).shift() as any;
            trash.children = new DatumArray(trash.children);
            return trash;
        });
    },

    /**
     * GET /projectsを発行して全てのプロジェクトを取得する
     * @throws {ErrorResponse}
     */
    findProjects: (onRoot?: boolean, exceptMyProject?: boolean, members?: boolean):Promise<ProjectType[]> => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {on_root?:string, except_myproject?:string, members?:string} = {};
        onRoot && (params.on_root = 'on');
        exceptMyProject && (params.except_myproject = 'on');
        members && (params.members = 'on');
        return get<ProjectType[]>('/api/v0/projects', params).then(projects => {
            return new DatumArray(projects) as any;
        });
    },

    /**
     * GET /projectsを発行してプロジェクトを取得する
     * @param uuid 取得するプロジェクトのUUID
     * @throws {ErrorResponse}
     */
    findProject: (uuid: string, offset?:number, limit?:number, members?: boolean) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {offset?:number, limit?:number, members?:string} = {};
        addOffsetLimit(params, offset, limit);
        members && (params.members = 'on');
        return get<ParentProjectType>(`/api/v0/projects/${uuid}`, params).then(project => {
            project = (new DatumArray([project])).shift() as any;
            project.children = new DatumArray(project.children);
            return project;
        });
    },

    /**
     * GET /foldersを発行してフォルダを取得する
     * @param uuid 取得するフォルダのUUID
     * @throws {ErrorResponse}
     */
    findFolder: (uuid: string, offset?:number, limit?:number) => {
        let params: {offset?:number, limit?:number} = {};
        addOffsetLimit(params, offset, limit);
        return get<ParentFolderType>(`/api/v0/folders/${uuid}`, params).then(folder => {
            folder = (new DatumArray([folder])).shift() as any;
            folder.children = new DatumArray(folder.children);
            return folder;
        });
    },

    /**
     * GET /flowsを発行してフローを取得する
     * @param uuid 取得するフローのUUID
     * @throws {ErrorResponse}
     */
    findFlow: (uuid: string) => {
        return get<FlowType>(`/api/v0/flows/${uuid}`).then(flow => {
            flow = (new DatumArray([flow])).shift() as any;
            const flowJson = flow.flow;
            flowJson.nodes = new NodeArray(flowJson.nodes);
            // 配列プロパティがない場合は空値を格納する
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
    },

    /**
     * GET /archives/flowsを発行してフローのファイルを取得する
     * @param uuid 取得するフローまたはフォルダのUUID
     */
    downloadFlow: (uuid: string, label: string) => {
        const accept = `application/gzip`;
        const fileName = label + '.tgz';
        return download(`/api/v0/archives/flows/${uuid}`, accept, fileName);
    },

    /**
     * GET /framesを発行してフレームを取得する
     * @param uuid 取得するフレームのUUID
     * @throws {ErrorResponse}
     */
    findFrame: (uuid: string, contents?: boolean, offset?: number, limit?: number) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        let params: {contents?:string, offset?:number, limit?:number} = {};
        contents && (params.contents = 'on');
        offset && (params.offset = offset);
        limit && (params.limit = limit);
        return get<FrameType>(`/api/v0/frames/${uuid}`, params).then(frame => {
            frame = (new DatumArray([frame])).shift() as any;
            return frame;
        });
    },

    /**
     * GET /framesを発行してフレームのファイルを取得する
     * @param uuid 取得するフレームのUUID
     */
    downloadFrame: (uuid: string, label: string, encoding?: string) => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        const params = {contents:true};
        const accept = `text/csv; charset=${encoding||'utf-8'}`;
        // ダウンロードファイル名を作成する
        let fileName: string;
        if(label.endsWith('.csv') || label.endsWith('.txt')){
            fileName = label;
        }else{
            fileName = label + '.csv';
        }
        return download(`/api/v0/frames/${uuid}`, accept, fileName, params);
    },

    /**
     * GET /documentsを発行してドキュメントファイルを取得する
     * @param uuid 取得するドキュメントのUUID
     */
    downloadDocument: (uuid: string, label: string, extension: string='') => {
        // 引数が指定された場合はparamsオブジェクトに引数のプロパティを追加する
        const params = {contents:true};
        const accept = '*/*';
        // ダウンロードファイル名を作成する
        let fileName: string;
        if(label.includes('.') || extension===''){
            fileName = label;
        }else{
            fileName = label + '.' + extension;
        }
        return download(`/api/v0/documents/${uuid}`, accept, fileName, params);
    },

    /**
     * GET /subflowsを発行してサブフローを取得する
     * @throws {ErrorResponse}
     */
    findSubflows: () => {
        return get<Flow[]>('/api/v0/subflows');
    },

    /**
     * GET /datasrcsを発行してデータソースを取得する
     * @throws {ErrorResponse}
     */
    findDataSrcs: () => {
        return get<Flow[]>('/api/v0/datasrcs');
    },

    /**
     * GET /datadstsを発行してデータデストを取得する
     * @throws {ErrorResponse}
     */
    findDataDsts: () => {
        return get<Flow[]>('/api/v0/datadsts');
    },

    /**
     * GET /commandsを発行してCommandを取得する
     * @throws {ErrorResponse}
     */
    findCommands: () => {
        return get<Command[]>('/api/v0/commands');
    },

    /**
     * GET /vcommandsを発行してVCommandを取得する
     * @throws {ErrorResponse}
     */
    findVCommands: () => {
        return get<Command[]>('/api/v0/vcommands');
    },

    /**
     * GET /navigationを発行してNavigationを取得する
     * @throws {ErrorResponse}
     */
    findNavigation: () => {
        return get<NavigationType>('/api/v0/navigation');
    },

    /**
     * GET /connectables/remote-foldersを発行して
     * RemoteFolderへの接続を確認する
     */
    checkRemoteFolderConnection: (
        protocol: 'smb',
        hostname: string,
        domain: string,
        directory: string,
        userId: string,
        password: string
    ) => {
        const params = {
            protocol: protocol,
            hostname: hostname,
            domain: domain,
            directory: directory,
            userId: userId,
            password: password
        };
        return get<ConnectivityType>('/api/v0/connections/remote-folders', params);
    },

    /**
     * GET /connectables/databasesを発行して
     * Databaseへの接続を確認する
     */
    checkDatabaseConnection: (
        dbms: 'postgresql'|'oracle',
        hostname: string,
        port: number,
        database: string,
        userId: string,
        password: string
    ) => {
        const params = {
            dbms: dbms,
            hostname: hostname,
            port: port,
            database: database,
            userId: userId,
            password: password
        };
        return get<ConnectivityType>('/api/v0/connections/databases', params);
    },

    /**
     * POST /vizsを発行してフローをプレビューする
     * @param flowUUID
     * @throws {ErrorResponse}
     */
    createFlowVis: (flowUUID:string, args:{}, lockUUID?:string) => {
        const body = {uuid:flowUUID, args:args, lock:lockUUID};
        return post<ActivityType>('/api/v0/vizs', body);
    },

    /**
     * POST /vizsを発行してFrameをプレビューする
     * @param flowUUID
     * @throws {ErrorResponse}
     */
    createFrameVis: (frameUUID:string, args:{}) => {
        const body = {frame:frameUUID, args:args};
        return post<ActivityType>('/api/v0/vizs', body);
    },

    /**
     * POST /activitiesを発行してフローを実行する
     * @param flowUUID
     * @throws {ErrorResponse}
     */
    createActivity: (flowUUID:string, args:{}, lockUUID?:string) => {
        const body = {uuid:flowUUID, args:args, lock:lockUUID};
        return post<ActivityType>('/api/v0/activities', body);
    }

};
