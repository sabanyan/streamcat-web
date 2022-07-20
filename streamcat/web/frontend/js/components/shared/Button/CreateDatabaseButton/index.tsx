import React from 'react';
import { FolderType, DatabaseType } from 'Model/Library';
import { DialogButton, TextField2, Select2 } from 'Shared/Input';
import { Value } from 'Shared/Input/TextField2';
import { EditBox } from 'Shared/Base/EditBox';

type Props = {
    parent:FolderType;
    onSuccess:(newDatabase:DatabaseType) => void;
};

/**
 * データベースの追加ボタン
 * @param props 
 */
export const CreateDatabaseButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 空の入力値
    const initValue:Value = {value:'', isError:true}
    const initSelectValue:Value = {value:'postgresql', isError:false}
    const initPortValue:Value   = {value:'5432', isError:false}

    // テキストボックスの入力値
    const [label, setLabel]       = React.useState(initValue);
    const [dbms, setDbms]         = React.useState(initSelectValue);
    const [hostname, setHostname] = React.useState(initValue);
    const [port, setPort]         = React.useState(initPortValue);
    const [database, setDatabase] = React.useState(initValue);
    const [userId, setUserId]     = React.useState(initValue);
    const [password, setPassword] = React.useState(initValue);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initValue);
        setDbms(initSelectValue);
        setHostname(initValue);
        setPort(initPortValue);
        setDatabase(initValue);
        setUserId(initValue);
        setPassword(initValue);
    };

    // データベースの新規追加処理
    const create = () => parent.createDatabase( label.value,
                                                dbms.value,
                                                hostname.value,
                                                parseInt(port.value),
                                                database.value,
                                                userId.value,
                                                password.value);

    return <DialogButton label='データベースの追加'
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox
                key='createRemoteFolder'
                // 編集ロック=ONの場合は編集不可
                createMode={true}
                values = {[label,dbms,hostname,port,database]}
                initValues={initValues}
                create={create}
                onSuccess={(newDatabase) => {
                    onSuccess(newDatabase as DatabaseType);
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
                    <Select2    key={'dbms'}
                                label='DBMS'
                                required={true}
                                items={[{label:'PostgreSQL',value:'postgresql'},
                                        {label:'ORACLE',value:'oracle'}]}
                                readOnly={readOnly}
                                state={[dbms,setDbms]}
                                onErrorChange={onErrorChange} />,
                    <TextField2 key={'hostname'}
                                label='ホスト名またはIPアドレス'
                                required={true}
                                readOnly={readOnly}
                                state={[hostname,setHostname]}
                                onErrorChange={onErrorChange}
                                onEnterKeyPress={onEnterKeyPress} />,
                    <TextField2 key={'port'}
                                label='ポート番号'
                                type='number'
                                required={true}
                                readOnly={readOnly}
                                state={[port,setPort]}
                                onErrorChange={onErrorChange}
                                onEnterKeyPress={onEnterKeyPress} />,
                    <TextField2 key={'database'}
                                label='データベース名'
                                required={true}
                                readOnly={readOnly}
                                state={[database,setDatabase]}
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
