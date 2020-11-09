import { ApiBase } from 'Modules/api/core/index'
import { Url, LockUUID } from "Modules/api/core/types/request";
import Constants from 'Constants/index';

// PUT
export type Props = Url & {
  libraryUUID: string,
  libraryType: string,
  lockUUID: string | null
}

const defaultUrl = {
  folders: '/api/v0/folders',
  projects: '/api/v0/projects',
  flows: '/api/v0/flows',
  frame: '/api/v0/frames',
  documents: '/api/v0/document',
  databases: '/api/v0/databases',
  remoteFolders: '/api/v0/remote-folders'
}

export function library(props: Props) {

  let url = props.url
  let data = { lock: props.lockUUID }

  if (!url) {
    switch (props.libraryType) {
      case Constants.library.type.folder:
        url = defaultUrl.folders
        break;
      case Constants.library.type.project:
        url = defaultUrl.projects
        break;
      case Constants.library.type.flow:
        url = defaultUrl.flows
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

  return ApiBase.Delete(resultUrl, {}, data)
}

