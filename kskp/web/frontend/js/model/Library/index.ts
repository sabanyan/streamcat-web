

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

type Folder = {
  type: string
  uuid: string
  label: string
}

type Props = {
  uuid: string
  type: string
  label: string
  creator: string
  createdAt: string
  // children
  children: LibraryChild[]
  folderUuid: string
  // folderPath
  folderPath: Folder[]
}

export type LibraryModel = {
  uuid: string;
  type: string;
  label: string;
  creator: string;
  createdAt: string;
  // children
  children: LibraryChild[];
  folderUuid: string;
  // folderPath
  folderPath: Folder[];
}
