import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { AwaitButton, Button2, DialogButton } from 'Shared/Input';

type Props = {
    readOnly?: boolean;
    navigation: NavigationType | null;
    user: UserType;
    onSuccess?: (newUser:UserType) => void;
};

export const ResetPasswordButton = (props:Props) => {
    const {readOnly, navigation, user, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // ユーザのパスワードをリセットする
    const resetUserPassword = () =>{
        return user.resetPassword().then(newUser => {
            notifySuccess('パスワードをリセットしました');
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(newUser);
        }).catch(e => {
            notifyError('パスワードリセットエラー', e.message);
        });
    };

    // ユーザのパスワードをリセット可能な場合にTrue
    const enabled = navigation && navigation.allowlist && navigation.allowlist.updateUser;

    return <DialogButton label='パスワードリセット'
                         dialogTitle='ユーザ を仮登録のステータスにして、パスワードを自動的に生成したパスワードに変更しますがよろしいですか？'
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[<p key='warning'>パスワードを再生成すると現在設定されているパスワードは利用できなくなります</p>],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <AwaitButton key='resetPasswd'
                        onClick={() => resetUserPassword().finally(() => {
                            closeDialog()
                        })}>パスワードをリセットする</AwaitButton>
        ]
    ]}</DialogButton>;
};
