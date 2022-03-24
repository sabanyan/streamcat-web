import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ErrorResponse } from 'Utils/APIUtil2';
import { FolderType, RemoteFolderType } from 'Model/Library';
import { useStreamCatNotifications } from 'Components/shared/Notification';
import { FlatButton, TextField2, Select2 } from 'Components/shared/Input';
import { Value } from 'Components/shared/Input/TextField2';

type Props = {
    parent:FolderType;
    onSuccess:(newRemoteFolder:RemoteFolderType) => void;
};

/**
 * リモートフォルダの追加ボタン
 * @param props 
 */
export const CreateRemoteFolderButton = (props:Props) => {
    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();
    // 空の入力値
    const emptyValue:Value = {value:'', isError:false}
    const initSelectValue:Value = {value:'smb', isError:false}

    // ダイアログの開閉状態
    const [isOpen, setIsOpen] = React.useState(false);
    // 追加ボタンの押下可否
    const [isDialogError, setIsDialogError] = React.useState(true);
    // ダイアログを開く
    const openDialog = () => {
        setIsOpen(true);
    };
    // ダイアログを閉じる
    const closeDialog = () => {
        // 全ての状態変数を初期化する
        setIsOpen(false);
        setIsDialogError(true);
        setLabel(emptyValue);
        setProtocol(initSelectValue);
        setHostname(emptyValue);
        setDomain(emptyValue);
        setDirectory(emptyValue);
        setUserId(emptyValue);
        setPassword(emptyValue);
    };

    // テキストボックスの入力値
    const [label, setLabel] = React.useState(emptyValue);
    const [protocol, setProtocol] = React.useState(initSelectValue);
    const [hostname, setHostname] = React.useState(emptyValue);
    const [domain, setDomain] = React.useState(emptyValue);
    const [directory, setDirectory] = React.useState(emptyValue);
    const [userId, setUserId] = React.useState(emptyValue);
    const [password, setPassword] = React.useState(emptyValue);
    // テキストボックスのエラー状態が変更された時、追加ボタンの押下可否を更新する
    const onErrorChange = (isError:boolean) => {
        if(isError){
            // エラーの場合は、追加ボタンを無効にする
            setIsDialogError(true);
        }else{
            // エラー状態の変更前における、全てのエラー状態のテキストボックスを数える
            const errorCount = [label,
                                protocol,
                                hostname,
                                domain,
                                directory,
                                userId,
                                password].filter(value => value.isError).length;
            // このイベントハンドラを呼び出したテキストボックスの変更前のエラー状態は、trueなのでその分を引く
            (errorCount - 1) === 0 && setIsDialogError(false);
        }
    };
    // エンターキーの押下処理
    const onEnterKeyPress = (value:Value) => {
        // リモートフォルダを新規作成する
        onClickCreate(label.value,
                      protocol.value,
                      hostname.value,
                      domain.value,
                      directory.value,
                      userId.value,
                      password.value);
    };

    // 追加ボタンの押下処理
    const onClickCreate =  (label:string,
                            protocol: string,
                            hostname: string,
                            domain: string,
                            directory: string,
                            userId: string,
                            password: string) => {
        const {parent, onSuccess} = props;
        // エラーの場合は処理を中断する
        if(isDialogError){
            return;
        }
        // リモートフォルダを新規作成する
        parent.createRemoteFolder(label,
                                  protocol,
                                  hostname,
                                  domain,
                                  directory,
                                  userId,
                                  password).then(folder => {
            notifySuccess('リモートフォルダを作成しました', folder.label);
            // ダイアログを閉じる
            closeDialog();
            // イベントハンドラを呼び出す
            onSuccess(folder);
        }).catch((error:ErrorResponse) => {
            notifyError('リモートフォルダ作成エラー', error.message);
        });
    };

    return <>
        {/* ボタン */}
        <FlatButton icon={'icon-add'} onClick={openDialog}>リモートフォルダの追加</FlatButton>
        {/* ダイアログ */}
        <Dialog // ある程度の横幅を設定する
                fullWidth={true}
                // ダイアログの開閉状態
                open={isOpen}
                onClose={closeDialog}>
            <DialogTitle>リモートフォルダの追加</DialogTitle>
            <DialogContent>
                <TextField2 label='リモートフォルダ名'
                            required={true}
                            autoFocus={true}
                            state={[label,setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />
                <Select2    label='プロトコル'
                            required={true}
                            items={[{label:'Samba',value:'smb'}]}
                            state={[protocol, setProtocol]}
                            onErrorChange={onErrorChange} />
                <TextField2 label='ホスト名またはIPアドレス'
                            required={true}
                            state={[hostname,setHostname]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />
                <TextField2 label='ドメイン名'
                            required={true}
                            state={[domain,setDomain]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />
                <TextField2 label='ディレクトリパス'
                            required={true}
                            state={[directory,setDirectory]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />
                <TextField2 label='ユーザーID'
                            state={[userId,setUserId]}
                            onEnterKeyPress={onEnterKeyPress} />               
                <TextField2 label='パスワード'
                            type='password'
                            state={[password,setPassword]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />
            </DialogContent>
            <DialogActions>
                <Button onClick={closeDialog}>キャンセル</Button>
                <Button disabled={isDialogError}
                        onClick={() => onClickCreate(label.value,
                                                     protocol.value,
                                                     hostname.value,
                                                     domain.value,
                                                     directory.value,
                                                     userId.value,
                                                     password.value)}>追加する</Button>
            </DialogActions>
        </Dialog>
    </>;
};
