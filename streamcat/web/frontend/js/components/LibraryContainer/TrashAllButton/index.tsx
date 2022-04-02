import React from "react";
import { useStreamCatNotifications } from "Components/shared/Notification";
import { TrashType } from "Model/Library";
import { Button2, DialogButton } from "Components/shared/Input";

type Props = {
    readOnly?: boolean;
    trashFolder: TrashType;
    onSuccess?: () => void;
};

export const TrashAllButton = (props:Props) => {
    const {readOnly, trashFolder, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    const trashAll = () => {
        // 削除完了メッセージを表示する
        return trashFolder.trashAll().then(() => {
            notifySuccess('ゴミ箱を空にしました');
            // イベントハンドラを呼び出す
            onSuccess && onSuccess();
        }).catch((e) => {
            notifyError('ゴミ箱を空にする処理でエラー', e.message);
        });
    };

    // 選択中の全てのDatumが更新可能の場合にTrue
    const enabled = trashFolder.allowlist.delete;

    return <DialogButton label={'ゴミ箱を空にする'}
                         dialogTitle={'ゴミ箱にある項目を完全に消去してもよろしいですか？'}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[<p key='warning'>この操作は取り消せません</p>],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <Button2 key='trashAll'
                     onClick={() => trashAll().finally(() => {
                        closeDialog()
                     })}>ゴミ箱を空にする</Button2>
        ]
    ]}</DialogButton>;
};
