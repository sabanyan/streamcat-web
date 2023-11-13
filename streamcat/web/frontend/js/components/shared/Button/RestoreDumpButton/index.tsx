import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { Api } from 'Api';
import { NavigationType } from 'Model/Navigation/NavigationModel';
import { EditBox } from 'Shared/Base/EditBox';
import { DialogButton } from 'Shared/Input';
import { FileField, Value } from 'Shared/Input/FileField';

type Props = {
    readOnly?:boolean;
    navigation: NavigationType | null;
    onSuccess?:() => void;
};

export const RestoreDumpButton = (props:Props) => {
    const {readOnly, navigation, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // 初期表示値
    const initFile = {value:null, isError:true};
    // テキストボックスの値
    const [file, setFile] = React.useState<Value>(initFile);

    // 値の初期化処理
    const initValues = () => {
        setFile(initFile);
    };

    const restoreDump = (file:File|null) => {
        if(!file){
            throw new Error('no dump file argument provided');
        }
        return Api.restoreDump(file).then(() => {
            notifySuccess('システムを復元しました');
        }).catch((e) => {
            notifyError('システム復元エラー', e.message);
        });
    };

    // システムの復元が可能な場合にTrue
    const enabled = navigation && navigation.allowlist && navigation.allowlist.restoreDump;

    return <DialogButton label='システムの復元'
                         dialogTitle='Dumpファイルからシステムを復元します'
                         icon='upload'
                         large={true}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        (closeDialog) => [
            <p key='warning'>フローを含む全てのデータと設定が破棄されます!<br/>この操作は取り消せません!</p>,
            <EditBox<void>
                key='restore'
                // 編集ロック=ONの場合は編集不可
                createMode={true}
                values = {[file]}
                initValues={initValues}
                create={() => restoreDump(file.value)}
                onSuccess={() => {
                    onSuccess && onSuccess();
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                () => [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyDown) => [
                    <FileField  key='file'
                                label='システムDump'
                                required={true}
                                requiredMessage='システムDumpを指定して下さい'
                                accepts={['application/gzip']}
                                state={[file, setFile]}
                                onErrorChange={onErrorChange} />
                ]
            ]}</EditBox>
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
