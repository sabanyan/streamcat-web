import React from "react";
import { Button, Dialog, DialogActions, DialogTitle } from '@mui/material';
import { APIUtil2 } from "Utils/APIUtil2";
import { useStreamCatNotifications } from "Components/shared/Notification";
import LibraryUtil from "Utils/LibraryUtil";
import { DatumType } from "Model/Library";

type Props = {
    target: DatumType;
    onSuccess?: (target:DatumType) => void;
};

export const DeleteButton = (props:Props) => {
    const {target, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // ダイアログの開閉状態
    const [isOpen, setIsOpen] = React.useState(false);
    // ダイアログを開く
    const openDialog = () => {
        setIsOpen(true);
    };
    // ダイアログを閉じる
    const closeDialog = () => {
        setIsOpen(false);
    };

    const onClickDelete = (datum:DatumType) => {
        let promise: Promise<void>;
        if (datum.type === 'flow') {
            // Flowの場合は、Lockを取得してから削除する
            promise = APIUtil2.createLock(datum.uuid).then(lock => {
                // Datumを削除する
                return datum.delete(lock.uuid).finally(() => {
                    // Flowの削除が完了した後に、Lockを解除する
                    lock.delete();
                });
            });
        }else{
            // Datumを削除する
            promise = datum.delete(); 
        }
        // 削除完了メッセージを表示する
        return promise.then(() => {
            const typeLabel = LibraryUtil.getTypeLabel(datum.type);
            notifySuccess(typeLabel + 'を削除しました', datum.label);
            // ダイアログを閉じる
            closeDialog();
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(datum);
        })
        .catch((e) => {
            notifyError(`ライブラリー削除エラー(${datum.label})`, e.message);
        });
    };

    return <>
        {/* ボタン */}
        <Button onClick={openDialog}>削除する</Button>
        {/* ダイアログ */}
        <Dialog // ある程度の横幅を設定する
                fullWidth={true}
                // ダイアログの開閉状態
                open={isOpen}
                onClose={closeDialog}>
            <DialogTitle>{target.label}を削除しますか？</DialogTitle>
            <DialogActions>
                <Button onClick={closeDialog}>キャンセル</Button>
                <Button onClick={() => onClickDelete(target)}>削除する</Button>
            </DialogActions>
        </Dialog>
    </>;
};
