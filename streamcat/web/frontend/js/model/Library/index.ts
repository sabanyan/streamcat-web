import {
    CommandNodeType,
    FlowNodeType,
    FrameNodeType,
    InlineFlowNodeType,
    NoteNodeType
} from 'Model/Step/NodeTypes';

/**
 * Datumの種別
 */
type Type =
    'project'
  | 'folder'
  | 'trash'
  | 'rfolder'
  | 'database'
  | 'flow'
  | 'schedule'
  | 'frame'
  | 'document'
  | 'activity'
  ;

/**
 * プロジェクトメンバの種別
 */
type MemberType = 
    'Reader'
  | 'Writer'
  | 'Owner'
  ;

/**
 * Datumのallowlist
 */
type Allowlist = {
    read: boolean;
    update: boolean;
    delete: boolean;
    execute: boolean;
    move: boolean;
    copy: boolean;
    download: boolean;
    export: boolean;
    findMember: boolean;
    updateMember: boolean;
    lock: boolean
};

/**
 * Folderのallowlist
 */
export type FolderAllowlist = Allowlist & {
    createProject: boolean;
    createFolder: boolean;
    createFile: boolean;
    upload: boolean;
    import: boolean;
};

/**
 * ProjectのMember
 */
export type Member = {
    uuid: string;
    email: string;
    name: string;
    state: 'tmp' | 'active' | 'inactive' | 'expired';
    creator: string;
    createdAt: string;
    type: MemberType;
};

/**
 * Datumの基本型
 */
type DatumBaseType<TAllowlist> = {
    uuid: string;
    type: Type;
    label: string;
    folderUuid: string | null;
    folderPath: string | null;
    prevFolderPath: string | null;
    allowlist: TAllowlist;
    creator: string;
    createdAt: string;

    move: (parent:string, lockUUID?:string) => Promise<DatumBaseType<TAllowlist>>;
    rename: (label:string, lockUUID?:string) => Promise<DatumBaseType<TAllowlist>>;
    duplicate:() => Promise<DatumBaseType<TAllowlist>>;
    delete: (lockUUID?:string) => Promise<DatumBaseType<TAllowlist>>;
};

/**
 * Datumを格納するオブジェクト型
 */
export type DatumType = DatumBaseType<Allowlist>;

/**
 * Folderを格納するオブジェクト型
 */
export type FolderType = DatumBaseType<FolderAllowlist> & {
    createProject:(
        label:string
    ) => Promise<ProjectType>;
    createFolder:(
        label:string
    ) => Promise<FolderType>;
    createRemoteFolder:(
        label: string,
        protocol: string,
        hostname: string,
        domain: string,
        directory: string,
        userId: string,
        password: string
    ) => Promise<RemoteFolderType>;
    createDatabase:(
        label: string,
        dbms: string,
        hostname: string,
        port: number,
        database?: string,
        userId?: string,
        password?: string
    ) => Promise<DatabaseType>;
    createFlow:(
        label:string,
        flow?:{}
    ) => Promise<FlowType>;
    createSchedule:(
        label: string,
        runnableUUID: string,
        args: {},
        inputs: {},
        trigger: {}
    ) => Promise<ScheduleType>;
    createFrame:(
        label:string,
        file:File
    ) => Promise<FrameType>;
    createDocument:(
        label:string,
        file:File
    ) => Promise<DocumentType>;
    uploadFlow:(
        label:string,
        file:File
    ) => Promise<void>;
};

/**
 * 子Datumを持つFolderを格納するオブジェクト型
 */
export type ParentFolderType = FolderType & {
    children: DatumType[];
};

/**
 * Projectを格納するオブジェクト型
 */
export type ProjectType = FolderType & {
    members?: Member[];
    modifiedAt: string;

    initMembers:(
        members: {uuid:string, type:MemberType}[],
        lastModifiedAt: string
    ) => Promise<ProjectType>;
    joinMember:(
        member: {uuid:string, type:MemberType}
    ) => Promise<void>;
};

/**
 * 子Datumを持つProjectを格納するオブジェクト型
 */
export type ParentProjectType = ProjectType & {
    children: DatumType[];
};

/**
 * ゴミ箱を格納するオブジェクト型
 */
export type TrashType = FolderType & {
    trashAll:() => Promise<void>;
    putBack:(uuid:string) => Promise<DatumType>;
};

/**
 * 子Datumを持つProjectを格納するオブジェクト型
 */
export type ParentTrashType = TrashType & {
    children: DatumType[];
};

/**
 * RemoteFolderを格納するオブジェクト型
 */
export type RemoteFolderType = DatumType & {
    protocol: string;
    hostname: string;
    domain: string;
    directory: string;
    userId: string;
    password: string;

    update:(
        label: string,
        protocol: string,
        hostname: string,
        domain: string,
        directory: string,
        userId: string,
        password: string
    ) => Promise<RemoteFolderType>;
};

/**
 * Databaseを格納するオブジェクト型
 */
export type DatabaseType = DatumType & {
    dbms: string;
    hostname: string;
    port: number;
    database: string;
    userId: string;
    password: string;

    update:(
        label: string,
        dbms: string,
        hostname: string,
        port: number,
        database: string,
        userId: string,
        password: string
    ) => Promise<DatabaseType>;
};

type Param = {
    name: string;
    type: string;
    label?: string;
    optional?: boolean;
};

export type Port = {
    label: string;
    nodeId: string;
    type: string;
};

type PortArray = Port[] & {
    exists: (portId: string) => boolean;
    upsert: (port: Port) => void;
    removeByNodeId: (nodeId: string) => void;
    toJSON: () => string;
};

export type AllNodeType = FrameNodeType | CommandNodeType | FlowNodeType | InlineFlowNodeType | NoteNodeType;

export type Flow = {
    label?: string;
    description?: string;
    nodes: AllNodeType[];
    params: Param[];
    ports: [PortArray,PortArray];
};

type BaseFlowCommand =  {
    label: string;
    // GET /subflowsはclassificationを返さない
    classification?: string;
    description: string;
    params: Param[];
    ports: [PortArray,PortArray];
    creator: string;
    createdAt: string;
};

// GET /subflows が返すデータ型
export type FlowCommand = BaseFlowCommand & {
    uuid: string;
};

// GET /datasrcs, GET /dtatdsts が返すデータ型
export type InlineFlowCommand = BaseFlowCommand & {
    // 
    flow: Flow & {
        creator: string;
        createdAt: string;
    };
};

export type Command = {
    version: string;
    id: string;
    label: string;
    classification: string;
    description: string;
    groups: [];
    params: {
        name: string;
        type: string;
        label: string;
        optional?: boolean;
        options: any;
        default?: string | number;
    }[];
    ports: [
        {
            label: string;
            type: string;
        }[],
        {
            label: string;
            type: string;
        }[]
    ];
    // TODO: コマンド引数の検証機能は無効にしているが
    // 型不整合のエラーを回避するためにrulesを残しておく
    rules: {};
};

/**
 * Flowを格納するオブジェクト型
 */
 export type FlowType = DatumType & {
    editLock: boolean;
    modifiedAt: string;
    flow: Flow;

    rename:(
        label,
        lockUUID
    ) => Promise<FlowType>;
    update:(
        flow:Flow,
        lockUUID?:string
    ) => Promise<FlowType>;
    updateLock:(
        editLock: boolean,
        lockUUID?: string
    ) => Promise<FlowType>;
    deleteCache:(
        nodeId: string
    ) => Promise<void>;
};

/**
 * Scheduleを格納するオブジェクト型
 */
export type ScheduleType = DatumType & {
    runnableUUID: string;
    args: {};
    inputs: {};
    trigger: {};

    update:(
        label: string,
        runnableUUID: string,
        args: {},
        inputs: {},
        trigger: {}
    ) => Promise<ScheduleType>;
};

/**
 * Frameを格納するオブジェクト型
 */
export type FrameType = DatumType & {
    fileSize: number;
    encoding: string;
    newline: string;

    args?: {column_names: string[]};
    contents?: string | null;

    update:(
        encoding:string,
        newline:string
    ) => Promise<FrameType>;
};

/**
 * Documentを格納するオブジェクト型
 */
 export type DocumentType = DatumType & {
    fileSize: number;
};

type Outs = {
    // 出力Pointのid
    id: string;
    // 出力Pointのラベル名
    label: string;
    // 出力データのUUID
    datum: string;
    // 出力データが格納されているフォルダのUUID
    parent: string | null;
    // 出力データの列名一覧
    args: {column_names: string[]};
    // HTMLに変換したVisデータ
    contents: string | null;
};

type Exs = {
    // 出力Pointのid
    id: string;
    // 出力Pointのラベル名
    label: string;
    // エラーメッセージ
    message: string;
};

/**
 * Activityを格納するオブジェクト型
 */
export type ActivityType = DatumType & {
    flowUuid: string;
    startAt: string;
    endAt: string;
    // 出力結果情報
    outs: Outs[];
    caches: [];
    exs: Exs[];
};
