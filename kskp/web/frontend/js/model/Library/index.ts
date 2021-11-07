
export const TYPE = {
  FOLDER: 'folder',
  AWSS3: 'awss3',
  RFOLDER: 'rfolder',
  DATABASE: 'database',
  FLOW: 'flow',
  FRAME: 'frame',
  TRASH: 'trash',
  UNDEFINED: 'undefined'
}

export type LibraryChild = {
  uuid: string
  type: string
  label: string
  encoding?: string
  fileSize?: string
  newline?: string
  creator: string
  createdAt: string
  prevFolderPath?: string // ごみの場合、元の場所
  selected? : boolean;
  editLock? : boolean;
  allowlist : {
    copy: boolean;
    createFile: boolean;
    createFolder: boolean;
    createProject: boolean;
    delete: boolean;
    download: boolean;
    execute: boolean;
    findMember: boolean;
    lock: boolean;
    move: boolean;
    read: boolean;
    update: boolean;
    updateMember: boolean;
    upload: boolean;
  }
}

// Datumのallowlist
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

// Folderのallowlist
type FolderAllowlist = Allowlist & {
  createProject: boolean;
  createFolder: boolean;
  createFile: boolean;
  upload: boolean;
  import: boolean;
}

type DatumBaseType<TAllowlist> = {
  uuid: string;
  type: string;
  label: string;
  folderUuid: string | null;
  folderPath: string | null;
  prevFolderPath: string | null;
  allowlist: TAllowlist;
  creator: string;
  createdAt: string;
}

// Datum
export type DatumType = DatumBaseType<Allowlist>;

// Folder
export type FolderType = DatumBaseType<FolderAllowlist> & {
  children: LibraryChild[];
};
