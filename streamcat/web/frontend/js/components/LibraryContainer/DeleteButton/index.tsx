import React from "react";
import { Dialog, DialogActions, DialogTitle } from '@mui/material';
import { APIUtil2 } from "Utils/APIUtil2";
import { useStreamCatNotifications } from "Components/shared/Notification";
import LibraryUtil from "Utils/LibraryUtil";
import { Button2 } from "Components/shared/Input";
import { DatumType } from "Model/Library";

type Props = {
    targets: DatumType[];
    onSuccess?: (targets:DatumType[]) => void;
};

export const DeleteButton = (props:Props) => {
    const {targets, onSuccess} = props;

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

    const deleteDatum = (datum:DatumType) => {
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
        }).catch((e) => {
            notifyError(`ライブラリー削除エラー(${datum.label})`, e.message);
        });
    }

    // 全てのDatumを削除する
    const onClickDelete = (data:DatumType[]) => {
        // 全てのDatumを削除した後に、ダイアログを閉じる
        Promise.all(
            data.map(datum => deleteDatum(datum))
        ).finally(() => {
            // ダイアログを閉じる
            closeDialog();
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(data);
        });
    };

    // 選択中の全てのDatumが更新可能の場合にTrue
    const enabled = targets.map(target => 
                        target.allowlist.delete).reduce((prevAllow, allow) => 
                        prevAllow && allow
                    );

    const targetLabels = targets.map(target =>
                            target.label).reduce((prevLabel, label) =>
                            prevLabel + ', ' + label
                        );

    return <>
        {/* ボタン */}
        <Button2 disabled={!enabled} onClick={openDialog}>削除する</Button2>
        {/* ダイアログ */}
        <Dialog // ある程度の横幅を設定する
                fullWidth={true}
                // ダイアログの開閉状態
                open={isOpen}
                onClose={closeDialog}>
            <DialogTitle>{targetLabels}を削除しますか？</DialogTitle>
            <DialogActions>
                <Button2 onClick={closeDialog}>キャンセル</Button2>
                <Button2 onClick={() => onClickDelete(targets)}>削除する</Button2>
            </DialogActions>
        </Dialog>
    </>;
};
