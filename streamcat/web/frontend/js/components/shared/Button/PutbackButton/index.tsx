import React from "react";
import { useStreamCatNotifications } from "Shared/Notification";
import { DatumType, TrashType } from "Model/Library";
import { Button2, DialogButton } from "Shared/Input";

type Props = {
    readOnly?: boolean;
    trashFolder: TrashType;
    datum: DatumType;
    onSuccess?: (datum:DatumType) => void;
};

export const PutbackButton = (props:Props) => {
    const {readOnly, trashFolder, datum, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    const putbackDatum = () => {
        // 移動完了メッセージを表示する
        return trashFolder.putBack(datum.uuid).then(() => {
            notifySuccess('元の場所に戻しました', datum.label);
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(datum);
        }).catch((e) => {
            notifyError('元の場所に戻す処理でエラー', e.message);
        });
    };

    // 選択中の全てのDatumが削除可能の場合にTrue
    // NOTE: ゴミ箱から戻す操作の逆操作は削除であるため、削除権限の有無で判定する
    const enabled = datum.allowlist.delete;

    return <DialogButton label='戻す'
                         dialogTitle={`${datum.label} を捨てる前の場所に戻しますか？`}
                         readOnly={!enabled || readOnly}>{[
        // Contents
        ()=>[],
        // Buttons
        (closeDialog) => [
            <Button2 key='cancel'
                     onClick={closeDialog}>キャンセル</Button2>,
            <Button2 key='putback'
                     onClick={() => putbackDatum().finally(() => {
                        closeDialog();
                     })}>戻す</Button2>
        ]
    ]}</DialogButton>;
};
