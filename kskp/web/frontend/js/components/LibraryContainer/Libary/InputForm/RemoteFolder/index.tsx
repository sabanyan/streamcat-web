import ParamsForm, { Param } from "Shared/Inspector/ParamsForm/index";

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from "react";

export const params = [
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
      "labels": ["Samba", "NFS"],
      "values": ["Samba", "NFS"]
    },
    "default": "Samba"
  },
  {
    "name": "hostname",
    "type": "string",
    "label": "ホスト名",
    "default": ""
  },
  {
    "name": "domain",
    "type": "number",
    "label": "ドメイン",
    "default": ""
  },
  {
    "name": "path",
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

function useRemoteFolder() {
  const args = useSelector(state => state.remoteFolder.args);
  const dispatch = useDispatch();

  useEffect(() => {

  }, [dispatch])

  const onAdd = () => {

  }

  const onEdit = () = {

  }

  return { add, edit, dispatch };
}

export function addRemoteFolder() {

}

export function editRemoteFolder() {

}