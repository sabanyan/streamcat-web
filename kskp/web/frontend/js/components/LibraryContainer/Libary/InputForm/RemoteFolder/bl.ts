import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from "react";


export interface RemoteFolder {
  label: string;
  protocol: any;
  hostname: string;
  domain: string;
  path: string;
  user_id: string;
  password: string;
}

function useRemoteFolder() {
  const args = useSelector(state => state.remoteFolder.args);
  const dispatch = useDispatch();

  useEffect(() => {

  }, [dispatch])

  const onAdd = () => {
    args 
  }

  const onEdit = (args) => {

  }

  const onDelete = () => {

  }

  return { args, onAdd, onEdit, onDelete};
}
