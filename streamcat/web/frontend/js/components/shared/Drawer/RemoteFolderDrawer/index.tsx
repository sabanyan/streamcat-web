import React from "react"
import { FolderType, RemoteFolderType } from "Model/Library";
import { Drawer2, Select2, TextField2 } from "Shared/Input";
import { MoveButton } from "Shared/Button/MoveButton";
import { DeleteButton } from "Shared/Button/DeleteButton";
import { CheckRemoteFolderButton } from "Shared/Button/CheckRemoteFolderButton";
import { EditBox } from "Shared/Base/EditBox";
import { CreatorField } from "Shared/Input/CreatorField";

type Props = {
    createMode: boolean;
    parent: FolderType;
    remoteFolder: RemoteFolderType;
    onSuccess:(newRemoteFolder:RemoteFolderType) => void;
};

export const RemoteFolderDrawer = (props:Props) => {
    const { createMode, parent, remoteFolder, onSuccess } = props;

    // 初期表示値
    const initLabel     = {value:createMode? '': remoteFolder.label, isError:createMode};
    const initProtocol  = {value:createMode? 'smb': remoteFolder.protocol, isError:false}
    const initHostname  = {value:createMode? '': remoteFolder.hostname, isError:createMode};
    const initDomain    = {value:createMode? '': remoteFolder.domain, isError:createMode};
    const initDirectory = {value:createMode? '': remoteFolder.directory, isError:createMode};
    const initUserId    = {value:createMode? '': remoteFolder.userId, isError:false};
    const initPassword  = {value:createMode? '': remoteFolder.password, isError:false};

    // テキストボックスの値
    const [label, setLabel]         = React.useState(initLabel);
    const [protocol, setProtocol]   = React.useState(initProtocol);
    const [hostname, setHostname]   = React.useState(initHostname);
    const [domain, setDomain]       = React.useState(initDomain);
    const [directory, setDirectory] = React.useState(initDirectory);
    const [userId, setUserId]       = React.useState(initUserId);
    const [password, setPassword]   = React.useState(initPassword);

    // リモートフォルダへの接続が確認済みの場合はTrue
    const [checked, setChecked] = React.useState(false);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setProtocol(initProtocol);
        setHostname(initHostname);
        setDomain(initDomain);
        setDirectory(initDirectory);
        setUserId(initUserId);
        setPassword(initPassword);
        setChecked(false);
    };

    // リモートフォルダの新規追加処理
    const create = () => parent.createRemoteFolder( label.value,
                                                    protocol.value,
                                                    hostname.value,
                                                    domain.value,
                                                    directory.value,
                                                    userId.value,
                                                    password.value);

    // リモートフォルダの更新処理
    const update = () => remoteFolder.update(label.value,
                                             protocol.value,
                                             hostname.value,
                                             domain.value,
                                             directory.value,
                                             userId.value,
                                             password.value);

    return <Drawer2>
        <EditBox createMode={createMode}
                 datum={remoteFolder}
                 values = {[label, protocol, hostname, domain, directory, userId, password]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 // キャンセル押下後に接続確認ボタンの確認結果が反映される場合があるので
                 // 変更ボタン押下時にも未確認状態に戻しておく 
                 onEdit={()=>setChecked(false)}
                 onSuccess={datum=>onSuccess(datum as RemoteFolderType)} >{[
            // ボタン
            (readonly) => readonly? [
                <MoveButton key='move'
                            parent={parent} 
                            targets={[remoteFolder]}
                            onSuccess={(data)=>onSuccess(data[0] as RemoteFolderType)} />,
                <DeleteButton key='del'
                              targets={[remoteFolder]}
                              onSuccess={(data)=>onSuccess(data[0] as RemoteFolderType)} />,
            ]: [
                <CheckRemoteFolderButton
                    key='check'
                    readOnly={readonly}
                    forceUnchecked={!checked}
                    protocol={protocol}
                    hostname={hostname}
                    domain={domain}
                    directory={directory}
                    userId={userId}
                    password={password}
                    onSuccess={() => setChecked(true)} />
            ],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key='label'
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <Select2    key='protocol'
                            label='プロトコル'
                            required={true}
                            items={[{label:'Samba',value:'smb'}]}
                            readOnly={readOnly}
                            state={[protocol, setProtocol]}
                            onChange={() => setChecked(false)}
                            onErrorChange={onErrorChange} />,
                <TextField2 key='hostname'
                            label='ホスト名またはIPアドレス'
                            required={true}
                            readOnly={readOnly}
                            state={[hostname,setHostname]}
                            onChange={() => setChecked(false)}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key='domain'
                            label='ドメイン名'
                            required={true}
                            readOnly={readOnly}
                            state={[domain,setDomain]}
                            onChange={() => setChecked(false)}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key='directory'
                            label='ディレクトリパス'
                            required={true}
                            readOnly={readOnly}
                            state={[directory,setDirectory]}
                            onChange={() => setChecked(false)}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key='userId'
                            label='ユーザーID'
                            readOnly={readOnly}
                            state={[userId,setUserId]}
                            onChange={() => setChecked(false)}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key='password'
                            label='パスワード'
                            type='password'
                            readOnly={readOnly}
                            state={[password,setPassword]}
                            onChange={() => setChecked(false)}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <CreatorField key='creator' datum={remoteFolder} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
