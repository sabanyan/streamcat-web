import React from "react"
import { FolderType, RemoteFolderType } from "Model/Library";
import { Drawer2, FixedField2,Select2, TextField2 } from "Components/shared/Input";
import { MoveButton } from "../MoveButton";
import { DeleteButton } from "../DeleteButton";
import { EditBox } from "../EditBox";

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
                 onSuccess={datum=>onSuccess(datum as RemoteFolderType)} >{[
            // ボタン
            [
                <MoveButton key={'move'}
                            parent={parent} 
                            targets={[remoteFolder]}
                            onSuccess={()=>onSuccess(remoteFolder)} />,
                <DeleteButton key={'del'}
                              targets={[remoteFolder]}
                              onSuccess={()=>onSuccess(remoteFolder)} />
            ],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key={'label'}
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <Select2    key={'protocol'}
                            label='プロトコル'
                            required={true}
                            items={[{label:'Samba',value:'smb'}]}
                            readOnly={readOnly}
                            state={[protocol, setProtocol]}
                            onErrorChange={onErrorChange} />,
                <TextField2 key={'hostname'}
                            label='ホスト名またはIPアドレス'
                            required={true}
                            readOnly={readOnly}
                            state={[hostname,setHostname]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key={'domain'}
                            label='ドメイン名'
                            required={true}
                            readOnly={readOnly}
                            state={[domain,setDomain]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key={'directory'}
                            label='ディレクトリパス'
                            required={true}
                            readOnly={readOnly}
                            state={[directory,setDirectory]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key={'userId'}
                            label='ユーザーID'
                            readOnly={readOnly}
                            state={[userId,setUserId]}
                            onEnterKeyPress={onEnterKeyPress} />,
                <TextField2 key={'password'}
                            label='パスワード'
                            type='password'
                            readOnly={readOnly}
                            state={[password,setPassword]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <FixedField2 key={'creator'}
                             label='作成者'
                             value={remoteFolder.creator} />,
                <FixedField2 key={'createdAt'}
                             label='作成日時'
                             value={remoteFolder.createdAt} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
