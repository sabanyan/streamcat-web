
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
  | 'frame'
  | 'document'
  | 'activity'
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
type FolderAllowlist = Allowlist & {
  createProject: boolean;
  createFolder: boolean;
  createFile: boolean;
  upload: boolean;
  import: boolean;
}

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
}

/**
 * Datumを格納するオブジェクト型
 */
export type DatumType = DatumBaseType<Allowlist>;

/**
 * Folderを格納するオブジェクト型
 */
export type FolderType = DatumBaseType<FolderAllowlist>;

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
  modifiedAt: string;
};

/**
 * Flowを格納するオブジェクト型
 */
export type FlowType = DatumType & {
  editLock: boolean;
  modifiedAt: string;
};

/**
 * Frameを格納するオブジェクト型
 */
export type FrameType = DatumType & {
  fileSize: number;
  encoding: string;
  newline: string;
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
}

