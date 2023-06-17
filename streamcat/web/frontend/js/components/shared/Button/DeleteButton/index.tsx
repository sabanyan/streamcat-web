import React from "react";
import { useStreamCatNotifications } from "Shared/Notification";
import LibraryUtil from "Utils/LibraryUtil";
import { AwaitButton, Button2, DialogButton } from "Shared/Input";
import { DatumType } from "Model/Library";
import { Api } from 'Api';

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
        let promise: Promise<DatumType>;
        if (datum.type === 'flow') {
            // Flowの場合は、Lockを取得してから削除する
            promise = Api.createLock(datum.uuid).then(lock => {
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
        return promise.then(datum => {
            const typeLabel = LibraryUtil.getTypeLabel(datum.type);
            notifySuccess(typeLabel + 'を削除しました', datum.label);
            return datum;
        }).catch((e) => {
            notifyError(`ライブラリー削除エラー(${datum.label})`, e.message);
            return datum;
        });
    }

    // 全てのDatumを削除する
    const deleteData = (data:DatumType[]) => {
        // 全てのDatumを削除した後に、ダイアログを閉じる
        return Promise.all(
            data.map(datum => deleteDatum(datum))
        ).then(data => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(data);
        }).catch(e => {
            // 失敗してもイベントハンドラを呼び出す
            // TODO: ただしonSuccessには全て削除前のDatumが渡される
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
                        onClick={() => deleteData(targets).finally(() => {
                            // TODO: notifySuccessによる通知ダイアログの表示で、ダイアログが閉じられる
                            // そのためここでcloseDialog()を呼び出すと
                            // "Can't perform a React state update on an unmounted component."
                            // という警告が表示される
                            closeDialog()
                        })}>削除する</AwaitButton>
        ]
    ]}</DialogButton>;
};
