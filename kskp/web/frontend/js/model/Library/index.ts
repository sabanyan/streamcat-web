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
 * WebAPI共通のレスポンスの型
 */
export type CommonResponse<DataType> = {
  success  : boolean;
  data     : DataType;
  message? : string;
  code?    : number;
};

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
  delete: (lockUUID?:string) => Promise<void>;
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

export type Port = {
  label: string;
  nodeId: string;
  type: string;
};

type PortArray = [] & {
  hasPort: (portId: string) => boolean,
  upsertPort: (port: Port) => void,
  removePort: (portId: string) => void,
  toJSON: () => string
};

export type Flow = {
  label?: string,
  description?: string,
  creator?: string,
  createdAt?: string,
  projectId?: number,
  nodes: any[]
  params: any[]
  ports: [PortArray,PortArray]
};

export type Command = {
  version: string;
  id: string;
  label: string;
  classification: string;
  description: string;
  groups:[]
  params:[{
    name: string;
    type: string;
    label: string;
    optional?: boolean;
    options: any;
    default?: string | number;
  }];
  ports:[{
    name: string;
    type: string;
  }];
};

/**
 * Flowを格納するオブジェクト型
 */
 export type FlowType = DatumType & {
  editLock: boolean;
  modifiedAt: string;
  flow: Flow;

  updateLock:(
    editLock: boolean,
    lockUUID?: string
  ) => Promise<FlowType>;
  update:(
    flow:Flow,
    lockUUID?:string
  ) => Promise<FlowType>;
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
  uuid: string;
  // 出力データが格納されているフォルダのUUID
  parent: string | null;
  // 出力データの列名一覧
  args: {column_names: string[]};
  // HTMLに変換したVisデータ
  contents: string | null;
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
  exs: [];
};
