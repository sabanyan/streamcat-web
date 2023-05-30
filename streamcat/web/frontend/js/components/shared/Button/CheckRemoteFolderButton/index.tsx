import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { Api } from 'Api';
import { ConnectivityType } from 'Model/Navigation/NavigationModel';
import { Value } from 'Shared/Input/TextField2';
import { Button2 } from 'Shared/Input';

type Props = {
    readOnly?: boolean;
    // 強制的に接続未確認状態にする
    forceUnchecked?: boolean;
    protocol: Value;
    hostname: Value;
    domain: Value;
    directory: Value;
    userId: Value;
    password: Value;
    onSuccess?: (connectivity:ConnectivityType) => void;
};

export const CheckRemoteFolderButton = (props:Props) => {
    const {
        readOnly,
        forceUnchecked,
        protocol,
        hostname,
        domain,
        directory,
        userId,
        password,
        onSuccess
    } = props;

    // 通知ダイアログ
    const {notifyError} = useStreamCatNotifications();

    // API応答待ち状態
    const [isLoading, setIsLoading] = React.useState(false);
    // 接続確認の結果
    const [connectivity, setConnectivity] = React.useState(false);

    // RemoteFolderの接続を確認する
    const checkConnection = () => {
        // ボタン押下を禁止する
        setIsLoading(true);
        return Api.checkRemoteFolderConnection(
            protocol.value as 'smb',
            hostname.value,
            domain.value,
            directory.value,
            userId.value,
            password.value
        ).then(result => {
            setConnectivity(result.conn);
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(result);
        }).catch((e) => {
            notifyError(`接続確認エラー`, e.message);
        }).finally(() =>{
            // ボタン押下禁止を解除する
            setIsLoading(false);
        });
    };

    // 入力項目に少なくとも一つのエラーがあればTrue
    const disabled =
        protocol.isError ||
        hostname.isError ||
        domain.isError ||
        directory.isError ||
        userId.isError ||
        password.isError;

    // 確認結果を示すアイコン
    const statusEmoji =
        forceUnchecked? '':
        connectivity? '✔': '❌';

    return <Button2 disabled={disabled || readOnly || isLoading}
                    onClick={() => checkConnection()}>{statusEmoji + ' 接続確認'}</Button2>
};
