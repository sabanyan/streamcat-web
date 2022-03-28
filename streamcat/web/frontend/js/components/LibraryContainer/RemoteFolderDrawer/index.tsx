import React from "react"
import { Drawer, Box, Button} from "@mui/material"
import { useStreamCatNotifications } from 'Components/shared/Notification';
import { ErrorResponse } from 'Utils/APIUtil2';
import { FolderType, RemoteFolderType } from "Model/Library";
import { Select2, TextField2, FixedField2 } from "Components/shared/Input";
import { Value } from 'Components/shared/Input/TextField2';
import { MoveButton } from "../MoveButton";
import { DeleteButton } from "../DeleteButton";

type Props = {
    parent: FolderType;
    remoteFolder: RemoteFolderType;
    create: boolean;
    onSuccess:(newRemoteFolder:RemoteFolderType) => void;
};

export const RemoteFolderDrawer = (props:Props) => {
    const { parent, remoteFolder, create, onSuccess } = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // 初期表示値
    const initLabel     = {value:create? '': remoteFolder.label, isError:create};
    const initProtocol  = {value:create? 'smb': remoteFolder.protocol, isError:false}
    const initHostname  = {value:create? '': remoteFolder.hostname, isError:create};
    const initDomain    = {value:create? '': remoteFolder.domain, isError:create};
    const initDirectory = {value:create? '': remoteFolder.directory, isError:create};
    const initUserId    = {value:create? '': remoteFolder.userId, isError:false};
    const initPassword  = {value:create? '': remoteFolder.password, isError:false};

    // ペインの変更可否
    const [readOnly, setReadOnly] = React.useState(!create);
    // 追加ボタンの押下可否
    const [isDrawerError, setIsDrawerError] = React.useState(create);
    // テキストボックスの値
    const [label, setLabel]         = React.useState(initLabel);
    const [protocol, setProtocol]   = React.useState(initProtocol);
    const [hostname, setHostname]   = React.useState(initHostname);
    const [domain, setDomain]       = React.useState(initDomain);
    const [directory, setDirectory] = React.useState(initDirectory);
    const [userId, setUserId]       = React.useState(initUserId);
    const [password, setPassword]   = React.useState(initPassword);

    // useState()の初期値はremoteFolderの値が変更されても変更されないため、ここで変更する必要がある
    React.useEffect(() => {
        // remoteFolderの変更に応じて表示値を変更する
        initValues();
        // remoteFolder、またはcreateの変更に応じてreadOnlyを変更する
        setReadOnly(!create);
        setIsDrawerError(create);
    }, [remoteFolder,create]);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setProtocol(initProtocol);
        setHostname(initHostname);
        setDomain(initDomain);
        setDirectory(initDirectory);
        setUserId(initUserId);
        setPassword(initPassword);
    };

    // テキストボックスのエラー状態が変更された時、確定ボタンの押下可否を更新する
    const onErrorChange = (isError:boolean) => {
        if(isError){
            // エラーの場合は、確定ボタンを無効にする
            setIsDrawerError(true);
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
            (errorCount - 1) === 0 && setIsDrawerError(false);
        }
    };
    // エンターキーの押下処理
    const onEnterKeyPress = (value:Value) => {
    };

    // キャンセルボタン押下時の処理
    const onClickClear = () => {
        // 全ての状態変数を初期化する
        setReadOnly(!create);
        setIsDrawerError(create);
        initValues();
    };

    const onClickUpdate =  (label:string,
                            protocol: string,
                            hostname: string,
                            domain: string,
                            directory: string,
                            userId: string,
                            password: string) => {
        // エラーの場合は処理を中断する
        if(isDrawerError){
            return;
        }

        // リモートフォルダを変更する
        remoteFolder.update(label,
                            protocol,
                            hostname,
                            domain,
                            directory,
                            userId,
                            password).then(folder => {
            notifySuccess('リモートフォルダを変更しました', folder.label);
            // ペインを変更不可にする
            setReadOnly(true);
            // イベントハンドラを呼び出す
            onSuccess(folder);
        }).catch((error:ErrorResponse) => {
            notifyError('リモートフォルダ変更エラー', error.message);
        });
    };

    // 追加ボタンの押下処理
    const onClickCreate =  (label:string,
                            protocol: string,
                            hostname: string,
                            domain: string,
                            directory: string,
                            userId: string,
                            password: string) => {
        // エラーの場合は処理を中断する
        if(isDrawerError){
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
            // ペインを変更不可にする
            setReadOnly(true);
            // イベントハンドラを呼び出す
            onSuccess(folder);
        }).catch((error:ErrorResponse) => {
            notifyError('リモートフォルダ作成エラー', error.message);
        });
    };

    return <Drawer sx={{width: '28%',
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: '28%',
                            boxSizing: 'border-box',
                        }
                      }}
                    variant="persistent"
                    anchor="right"
                    open={true} >
    <Box sx={{padding:'4%'}}>
        {/* ボタン */}
        {
            readOnly?
            <Box>
                <Button onClick={()=>setReadOnly(false)}>変更</Button>
                <MoveButton parent={parent} target={remoteFolder} onSuccess={()=>onSuccess(remoteFolder)} />
                <DeleteButton target={remoteFolder} onSuccess={()=>onSuccess(remoteFolder)} />
            </Box>:
            <Box>
                <Button onClick={onClickClear}>キャンセル</Button>
                <Button disabled={isDrawerError}
                        onClick={() =>  create?
                                        onClickCreate(label.value,
                                                    protocol.value,
                                                    hostname.value,
                                                    domain.value,
                                                    directory.value,
                                                    userId.value,
                                                    password.value):
                                        onClickUpdate(label.value,
                                                    protocol.value,
                                                    hostname.value,
                                                    domain.value,
                                                    directory.value,
                                                    userId.value,
                                                    password.value)}>確定</Button>
            </Box>
        }
        {/* テキストボックス */}
        <TextField2 label='ラベル'
                    required={true}
                    readOnly={readOnly}
                    state={[label, setLabel]}
                    onErrorChange={onErrorChange} />
        <Select2    label='プロトコル'
                    required={true}
                    items={[{label:'Samba',value:'smb'}]}
                    readOnly={readOnly}
                    state={[protocol, setProtocol]}
                    onErrorChange={onErrorChange} />
        <TextField2 label='ホスト名またはIPアドレス'
                    required={true}
                    readOnly={readOnly}
                    state={[hostname,setHostname]}
                    onErrorChange={onErrorChange}
                    onEnterKeyPress={onEnterKeyPress} />
        <TextField2 label='ドメイン名'
                    required={true}
                    readOnly={readOnly}
                    state={[domain,setDomain]}
                    onErrorChange={onErrorChange}
                    onEnterKeyPress={onEnterKeyPress} />
        <TextField2 label='ディレクトリパス'
                    required={true}
                    readOnly={readOnly}
                    state={[directory,setDirectory]}
                    onErrorChange={onErrorChange}
                    onEnterKeyPress={onEnterKeyPress} />
        <TextField2 label='ユーザーID'
                    readOnly={readOnly}
                    state={[userId,setUserId]}
                    onEnterKeyPress={onEnterKeyPress} />
        <TextField2 label='パスワード'
                    type='password'
                    readOnly={readOnly}
                    state={[password,setPassword]}
                    onErrorChange={onErrorChange}
                    onEnterKeyPress={onEnterKeyPress} />
        <FixedField2 label='作成者'
                     value={remoteFolder.creator} />
        <FixedField2 label='作成日時'
                     value={remoteFolder.createdAt} />
    </Box>
    </Drawer>;
};
