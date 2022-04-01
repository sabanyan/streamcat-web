import React from "react"
import { FolderType, DatabaseType } from "Model/Library";
import { Drawer2, FixedField2, Select2, TextField2 } from "Components/shared/Input";
import { MoveButton } from "../MoveButton";
import { DeleteButton } from "../DeleteButton";
import { EditBox } from "../EditBox";

type Props = {
    createMode: boolean;
    parent: FolderType;
    datum: DatabaseType;
    onSuccess:(database:DatabaseType) => void;
};

export const DatabaseDrawer = (props:Props) => {
    const { createMode, parent, datum, onSuccess } = props;

    // 初期表示値
    const initLabel    = {value:createMode? '': datum.label, isError:createMode};
    const initDbms     = {value:createMode? 'postgresql': datum.dbms, isError:false}
    const initHostname = {value:createMode? '': datum.hostname, isError:createMode};
    const initPort     = {value:createMode? '5432': datum.port.toString(), isError:createMode};
    const initDatabase = {value:createMode? '': datum.database, isError:createMode};
    const initUserId   = {value:createMode? '': datum.userId, isError:false};
    const initPassword = {value:createMode? '': datum.password, isError:false};

    // テキストボックスの値
    const [label, setLabel]       = React.useState(initLabel);
    const [dbms, setDbms]         = React.useState(initDbms);
    const [hostname, setHostname] = React.useState(initHostname);
    const [port, setPort]         = React.useState(initPort);
    const [database, setDatabase] = React.useState(initDatabase);
    const [userId, setUserId]     = React.useState(initUserId);
    const [password, setPassword] = React.useState(initPassword);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setDbms(initDbms);
        setHostname(initHostname);
        setPort(initPort);
        setDatabase(initDatabase);
        setUserId(initUserId);
        setPassword(initPassword);
    };

    // リモートフォルダの新規追加処理
    const create = () => parent.createDatabase( label.value,
                                                dbms.value,
                                                hostname.value,
                                                parseInt(port.value),
                                                database.value,
                                                userId.value,
                                                password.value);

    // リモートフォルダの更新処理
    const update = ()=>datum.update(label.value,
                                    dbms.value,
                                    hostname.value,
                                    parseInt(port.value),
                                    database.value,
                                    userId.value,
                                    password.value);

    return <Drawer2>
        <EditBox createMode={createMode}
                 datum={datum}
                 values = {[label, dbms, hostname, port, database, userId, password]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as DatabaseType)} >{[
            // ボタン
            [
                <MoveButton key={'move'}
                            parent={parent} 
                            targets={[datum]}
                            onSuccess={(data)=>onSuccess(data[0] as DatabaseType)} />,
                <DeleteButton key={'del'}
                              targets={[datum]}
                              onSuccess={(data)=>onSuccess(data[0] as DatabaseType)} />
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
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <FixedField2 key={'creator'}
                             label='作成者'
                             value={datum.creator} />,
                <FixedField2 key={'createdAt'}
                             label='作成日時'
                             value={datum.createdAt} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
