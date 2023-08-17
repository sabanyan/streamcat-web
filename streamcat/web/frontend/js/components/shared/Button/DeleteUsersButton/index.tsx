import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { AwaitButton, Button2, DialogButton } from 'Shared/Input';

type Props = {
    readOnly?: boolean;
    navigation: NavigationType | null;
    targets: UserType[];
    onSuccess?: (targets:UserType[]) => void;
};

export const DeleteUsersButton = (props:Props) => {
    const {readOnly, navigation, targets, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    const deleteUser = (user:UserType) => {
        // ユーザーを削除する
        const promise = user.delete(); 
        // 削除完了メッセージを表示する
        return promise.then(() => {
            notifySuccess('ユーザーを削除しました', user.name);
            return user;
        }).catch((e) => {
            notifyError(`ユーザー削除エラー(${user.name})`, e.message);
            return user;
        });
    };

    // 全てのユーザーを削除する
    const deleteUsers = (users:UserType[]) => {
        // 全てのユーザーを削除した後に、ダイアログを閉じる
        return Promise.all(
            users.map(user => deleteUser(user))
        ).then(user => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(user);
        }).catch(e => {
            // 失敗してもイベントハンドラを呼び出す
            // TODO: ただしonSuccessには全て削除前のUserが渡される
            onSuccess && onSuccess(users);
        });
    };

    // ユーザの削除可能な場合にTrue
    const enabled = navigation && navigation.allowlist && navigation.allowlist.deleteUser;

    const targetLabels = targets.map(target =>
                            target.name).reduce((prevLabel, label) =>
                            prevLabel + ', ' + label
                        );

    return <DialogButton label='削除'
                         dialogTitle={`${targetLabels}を削除しますか？`}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <AwaitButton key='delete'
                        onClick={() => deleteUsers(targets).finally(() => {
                            // TODO: notifySuccessによる通知ダイアログの表示で、ダイアログが閉じられる
                            // そのためここでcloseDialog()を呼び出すと
                            // "Can't perform a React state update on an unmounted component."
                            // という警告が表示される
                            closeDialog()
                        })}>削除する</AwaitButton>
        ]
    ]}</DialogButton>;
};
