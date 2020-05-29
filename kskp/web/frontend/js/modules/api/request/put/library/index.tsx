import { ApiBase } from 'Modules/api/core/index'
import { Url, LockUUID } from "Modules/api/core/types/request";
import Constants from 'Constants/index';


// PUT
export type Props = Url & {
  parentUUID: string,
  libraryUUID: string,
  libraryType: string,
  lockUUID: string | null
}

const defaultUrl = {
  folders: '/api/v0/folders',
  flows: '/api/v0/flows',
  frame: '/api/v0/frames',
  documents: '/api/v0/document',
  databases: '/api/v0/databases',
  remoteFolders: '/api/v0/remote-folders'
}

export function library(props: Props) {

  let url = props.url
  let data = {
    parent: props.parentUUID
  }
  if (!url) {
    switch (props.libraryType) {
      case Constants.library.type.folder:
        url = defaultUrl.folders
        break;
      case Constants.library.type.flow:
        url = defaultUrl.flows
        data['lock'] = props.lockUUID
        break;
      case Constants.library.type.frame:
        url = defaultUrl.frame
        break;
      case Constants.library.type.document:
        url = defaultUrl.documents
        break;
      case Constants.library.type.database:
        url = defaultUrl.databases
        break;
      case Constants.library.type.remoteFolder:
        url = defaultUrl.remoteFolders
        break;
    }
  }

  const resultUrl = url + '/' + props.libraryUUID

  return ApiBase.Put(resultUrl, data)
}

