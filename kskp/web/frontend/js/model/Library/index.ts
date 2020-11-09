

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
  // folderPath
  folderPath: Folder[]
}

export default class LibraryModel {
  uuid: string
  type: string
  label: string
  creator: string
  createdAt: string
  // children
  children: LibraryChild[]
  // folderPath
  folderPath: Folder[]

  constructor(json: Props) {
    this.uuid = json.uuid
    this.type = json.type
    this.label = json.label
    this.creator = json.creator
    this.createdAt = json.createdAt
    this.children = json.children
    this.folderPath = json.folderPath
  }

  jsonToModel(json: Props) {
    this.uuid = json.uuid
    this.type = json.type
    this.label = json.label
    this.creator = json.creator
    this.createdAt = json.createdAt
    this.children = json.children
    this.folderPath = json.folderPath
  }

  modelToJson(): Props {
    return {
      uuid: this.uuid,
      type: this.type,
      label: this.label,
      creator: this.creator,
      createdAt: this.createdAt,
      children: this.children,
      folderPath: this.folderPath
    }
  }

  isNotEmpty(): boolean {
    return (this.uuid) ? true : false
  }
}
