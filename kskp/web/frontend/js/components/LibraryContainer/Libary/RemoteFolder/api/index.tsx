import { remoteFolder } from 'Components/shared/IconRenderer/icon';
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { APIUtil } from 'Utils/index';
import { RemoteFolder } from 'Components/LibraryContainer/Libary/RemoteFolder/types'


// 以下はAPI
//　今後APIモージュルができたらそこに移動させる（？）
export function addRemoteFolder(parentUUID:string, remoteFolder: RemoteFolder) {
  const body = {
    label: remoteFolder.label,
    parent: parentUUID,
    protocol: remoteFolder.protocol,
    hostname: remoteFolder.hostname,
    domain: remoteFolder.domain,
    directory: remoteFolder.directory,
    user_id: remoteFolder.user_id,
    password: remoteFolder.password
  }

  return APIUtil.post("remote-folders", body)
}

export function editRemoteFolder(uuid:string, remoteFolder: RemoteFolder) {
  const body = {
    label: remoteFolder.label,
    protocol: remoteFolder.protocol,
    hostname: remoteFolder.hostname,
    domain: remoteFolder.domain,
    directory: remoteFolder.directory,
    user_id: remoteFolder.user_id,
    password: remoteFolder.password
  }
  return APIUtil.put("remote-folders/" + uuid, body)
}