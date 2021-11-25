import { RemoteFolder } from 'Components/LibraryContainer/Libary/RemoteFolder/types'
import { addRemoteFolder, editRemoteFolder } from 'Components/LibraryContainer/Libary/RemoteFolder/api'

import { useState } from 'react';
import _ from 'lodash';


const initState = {
  parentUUID: "",
  uuid: "",
  label: "",
  protocol: "smb",
  hostname: "",
  domain: "",
  directory: "",
  userId: "",
  password: "",
}

export enum Mode {INIT, ADD, EDIT};

// business logic
export const useRemoteFolderHooks = () => {
  const [remoteFolder, setRemoteFolder] = useState(initState);
  const [remoteFolderMode, setRemoteFolderMode] = useState<Mode>(Mode.INIT);

  const onAddRemoteFolder = ((parentUUID: string, remoteFolder:RemoteFolder) => {
    return addRemoteFolder(parentUUID, remoteFolder);
  });

  const clearRemoteFolder = () => {
    setRemoteFolder(initState);
  }

  const onEditRemoteFolder = ((uuid: string, remoteFolder: RemoteFolder) => {
    return editRemoteFolder(uuid, remoteFolder);
  });

  const onChangeRemoteFolder = (name:string, value:any) => {
    if (typeof(remoteFolder[name]) != "undefined") {
      setRemoteFolder({...remoteFolder, [name]:value});
    }
  }

  const isEmptyRemoteFolder = (remoteFolder:RemoteFolder) => {
    return _.isEqual(remoteFolder, initState);
  }

  return {
    onAddRemoteFolder,
    onEditRemoteFolder,
    onChangeRemoteFolder,
    isEmptyRemoteFolder,
    clearRemoteFolder,
    setRemoteFolder,
    remoteFolder,
    setRemoteFolderMode,
    remoteFolderMode,
  }
}