import React from "react";
import { APIUtil2 } from "Utils/APIUtil2";
import { useStreamCatNotifications } from "Components/shared/Notification";
import LibraryUtil from "Utils/LibraryUtil";
import { Button2, DialogButton } from "Components/shared/Input";
import { DatumType } from "Model/Library";

type Props = {
    readOnly?:boolean;
    targets: DatumType[];
    onSuccess?: (targets:DatumType[]) => void;
};

export const DeleteButton = (props:Props) => {
    const {readOnly, targets, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

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
        return Promise.all(
            data.map(datum => deleteDatum(datum))
        ).finally(() => {
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

    return <DialogButton label={'削除'}
                         dialogTitle={`${targetLabels}を削除しますか？`}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <Button2 key='delete'
                     onClick={() => onClickDelete(targets).finally(() => {
                        // TODO: notifySuccessによる通知ダイアログの表示で、ダイアログが閉じられる
                        // そのためここでcloseDialog()を呼び出すと
                        // "Can't perform a React state update on an unmounted component."
                        // という警告が表示される
                        closeDialog()
                     })}>削除する</Button2>
        ]
    ]}</DialogButton>;
};
