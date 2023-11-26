import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { Api } from 'Api';
import { NavigationType } from 'Model/Navigation/NavigationModel';
import { AwaitButton, Button2, DialogButton } from 'Shared/Input';

type Props = {
    readOnly?:boolean;
    navigation: NavigationType | null;
    onSuccess?: () => void;
};

export const DownloadDumpButton = (props:Props) => {
    const {readOnly, navigation, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // システムDumpをダウンロードする
    const downloadDump = () => {
        return Api.downloadDump().then(() => {
            notifySuccess('システムDumpをダウンロードしました');
        }).catch(e => {
            notifyError('システムDump取得エラー', e.message);
        }).finally(() => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess();
        });
    };

    // システムDumpが取得可能な場合にTrue
    const enabled = navigation && navigation.allowlist && navigation.allowlist.downloadDump;

    return <DialogButton label='システムDumpのダウンロード'
                         dialogTitle='システムDumpをダウンロードします'
                         large={true}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <AwaitButton key='dump'
                         disabled={readOnly}
                         onClick={() =>
                            downloadDump().then(() => closeDialog())
                         } >ダウンロード</AwaitButton>
        ]
    ]}</DialogButton>;
};
