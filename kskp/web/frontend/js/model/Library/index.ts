
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
}

/**
 * ProjectのMember
 */
type Member = {
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

  move: (parent:string) => Promise<DatumBaseType<TAllowlist>>;
  rename: (label:string) => Promise<DatumBaseType<TAllowlist>>;
  delete: (lockUUID?: string) => Promise<void>;
}

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
    user_id: string,
    password: string
  ) => Promise<RemoteFolderType>;
  createDatabase:(
    label: string,
    dbms: string,
    hostname: string,
    port: number,
    database: string,
    user_id: string,
    password: string
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
}

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
    members: [{uuid:string, type:MemberType}],
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
 * RemoteFolderを格納するオブジェクト型
 */
export type RemoteFolderType = DatumType & {
  protocol: string;
  hostname: string;
  domain: string;
  directory: string;
  user_id: string;
  password: string;

  update:(
    label: string,
    protocol: string,
    hostname: string,
    domain: string,
    directory: string,
    user_id: string,
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
  user_id: string;
  password: string;

  update:(
    label: string,
    dbms: string,
    hostname: string,
    port: number,
    database: string,
    user_id: string,
    password: string
  ) => Promise<DatabaseType>;
}

/**
 * Flowを格納するオブジェクト型
 */
 export type FlowType = DatumType & {
  editLock: boolean;
  modifiedAt: string;

  update:(
    label:string,
    flow:{}
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
}

/**
 * Frameを格納するオブジェクト型
 */
export type FrameType = DatumType & {
  fileSize: number;
  encoding: string;
  newline: string;

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

/**
 * Activityを格納するオブジェクト型
 */
 export type ActivityType = DatumType & {
  flow_uuid: string;
  start_time: string;
  end_time: string;
  outs: {};
  caches: {};
  exs: {};
};

