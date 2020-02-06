

const JSON_FOLDER_TYPE = 'folder'
const JSON_AWSS3_TYPE = 'awss3'
const JSON_RFOLDER_TYPE = 'rfolder'
const JSON_DATABASE_TYPE = 'database'
const JSON_FLOW_TYPE = 'flow'
const JSON_FRAME_TYPE = 'frame'
const JSON_TRASH_TYPE = 'trash'

export enum LIBRARY_TYPE {
  UNDEFINED,
  FOLDER,
  AWSS3,
  RFOLDER, // remotefolder
  DATABASE,
  FLOW,
  FRAME,
  TRASH
}

export type Library = {
  uuid: string
  type: string
  label: string
  creator: string
  createdAt: string
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
  children: Library[]
  // folderPath
  folderPath: Folder[]
}

export default class LibraryModel {
  uuid: string
  type: LIBRARY_TYPE
  label: string
  creator: string
  createdAt: string
  // children
  children: Library[]
  // folderPath
  folderPath: Folder[]

  constructor(props: Props) {
    this.uuid = props.uuid
    this.type = this.parseType(props.type)
    this.label = props.label
    this.creator = props.creator
    this.createdAt = props.createdAt
    this.children = props.children
    this.folderPath = props.folderPath
  }

  parseType(type: string): LIBRARY_TYPE {
    let result: LIBRARY_TYPE = LIBRARY_TYPE.UNDEFINED

    switch (type) {
      case JSON_FOLDER_TYPE: result = LIBRARY_TYPE.FOLDER
        break
      case JSON_AWSS3_TYPE: result = LIBRARY_TYPE.AWSS3
        break
      case JSON_RFOLDER_TYPE: result = LIBRARY_TYPE.RFOLDER
        break
      case JSON_DATABASE_TYPE: result = LIBRARY_TYPE.DATABASE
        break
      case JSON_FLOW_TYPE: result = LIBRARY_TYPE.FOLDER
        break
      case JSON_FRAME_TYPE: result = LIBRARY_TYPE.FRAME
        break
      case JSON_TRASH_TYPE: result = LIBRARY_TYPE.TRASH
        break
    }

    return result
  }

}