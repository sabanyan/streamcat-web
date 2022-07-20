import React from 'react';
import { FolderType, RemoteFolderType } from 'Model/Library';
import { DialogButton, TextField2, Select2 } from 'Shared/Input';
import { Value } from 'Shared/Input/TextField2';
import { EditBox } from 'Shared/Base/EditBox';

type Props = {
    parent:FolderType;
    onSuccess:(newRemoteFolder:RemoteFolderType) => void;
};

/**
 * リモートフォルダの追加ボタン
 * @param props 
 */
export const CreateRemoteFolderButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 空の入力値
    const initValue:Value = {value:'', isError:true}
    const initSelectValue:Value = {value:'smb', isError:false}

    // テキストボックスの入力値
    const [label, setLabel] = React.useState(initValue);
    const [protocol, setProtocol] = React.useState(initSelectValue);
    const [hostname, setHostname] = React.useState(initValue);
    const [domain, setDomain] = React.useState(initValue);
    const [directory, setDirectory] = React.useState(initValue);
    const [userId, setUserId] = React.useState(initValue);
    const [password, setPassword] = React.useState(initValue);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initValue);
        setProtocol(initSelectValue);
        setHostname(initValue);
        setDomain(initValue);
        setDirectory(initValue);
        setUserId(initValue);
        setPassword(initValue);
    };

    // リモートフォルダの新規追加処理
    const create = () => parent.createRemoteFolder( label.value,
                                                    protocol.value,
                                                    hostname.value,
                                                    domain.value,
                                                    directory.value,
                                                    userId.value,
                                                    password.value);

    return <DialogButton label='リモートフォルダの追加'
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox
                key='createRemoteFolder'
                // 編集ロック=ONの場合は編集不可
                createMode={true}
                values = {[label,protocol,hostname,domain,directory]}
                initValues={initValues}
                create={create}
                onSuccess={(newFolder) => {
                    onSuccess(newFolder as RemoteFolderType);
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyPress) => [
                    <TextField2 key={'label'}
                                label='ラベル'
                                required={true}
                                readOnly={readOnly}
                                autoFocus={true}
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
                                onEnterKeyPress={onEnterKeyPress} />
                ]
            ]}</EditBox>
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
