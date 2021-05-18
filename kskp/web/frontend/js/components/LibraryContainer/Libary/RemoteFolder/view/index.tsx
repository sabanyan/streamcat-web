import { RemoteFolder } from 'Components/LibraryContainer/Libary/RemoteFolder/types'
import ParamsForm from "Shared/Inspector/ParamsForm";

import React, { useEffect } from 'react';


const params:any = [
  {
    "name": "label",
    "type": "string",
    "label": "名称"
  },
  {
    "name": "protocol",
    "type": "select",
    "label": "プロトコル",
    "options": {
      "labels": ["Samba"],
      "values": ["smb"]
    },
    "default": "smb"
  },
  {
    "name": "hostname",
    "type": "string",
    "label": "ホスト名",
    "default": ""
  },
  {
    "name": "domain",
    "type": "string",
    "label": "ドメイン",
    "default": ""
  },
  {
    "name": "directory",
    "type": "string",
    "label": "ディレクトリ",
    "default": ""
  },
  {
    "name": "user_id",
    "type": "string",
    "label": "ユーザID",
    "default": ""
  },
  {
    "name": "password",
    "isPassword": true,
    "type": "string",
    "label": "パスワード",
    "default": ""
  }
];

type Props = {
  remoteFolder: RemoteFolder
  onChange: Function
}

// view
export const RemoteFolderForm = (props: Props) => {
  const { remoteFolder, onChange } = props;

  return <React.Fragment>
    <ParamsForm params={params} onChange={(e,param,value) => onChange(e, param, value)} args={remoteFolder} invalids={{}}></ParamsForm>
  </React.Fragment>
}
