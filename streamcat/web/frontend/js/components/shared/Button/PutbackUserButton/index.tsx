import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { Button2, DialogButton } from 'Shared/Input';

type Props = {
    readOnly?: boolean;
    navigation: NavigationType | null;
    user: UserType;
    onSuccess?: (newUser:UserType) => void;
};

export const PutbackUserButton = (props:Props) => {
    const {readOnly, navigation, user, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    const unDeleteUser = () => {
        return user.undelete().then(newUser => {
            notifySuccess('ユーザーを利用中に戻しました');
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(newUser);
        }).catch(e => {
            notifyError('ユーザを論理削除から登録状態に戻せませんでした', e.message);
        });
    };

    // ユーザ状態の変更が可能な場合にTrue
    const enabled = navigation && navigation.allowlist && navigation.allowlist.updateUser;

    return <DialogButton label='利用中に戻す'
                         dialogTitle={`${user.name} を利用中に戻しますか？`}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <Button2 key='undelete'
                     onClick={() => unDeleteUser().finally(() => {
                        closeDialog();
                     })}>利用中に戻す</Button2>
        ]
    ]}</DialogButton>;
};
