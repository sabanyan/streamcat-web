import React from "react";
import { useStreamCatNotifications } from "Components/shared/Notification";
import { FlowType } from "Model/Library";
import { Button2 } from "Components/shared/Input";

type Props = {
    readOnly?:boolean;
    targets: FlowType[];
    onSuccess?: (targets:FlowType[]) => void;
};

export const DuplicateButton = (props:Props) => {
    const {readOnly, targets, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // Datumを複製する
    const duplicateDatum = (datum:FlowType) => {
        return datum.duplicate().then(() => {
            notifySuccess('フローを複製しました', datum.label);
        }).catch((e) => {
            notifyError(`フロー複製エラー(${datum.label})`, e.message);
        });
    };

    // 全てのDatumを複製する
    const duplicateData = (data:FlowType[]) => {
        // 全てのDatumを複製した後に、イベントハンドラを呼び出す
        Promise.all(
            data.map(datum => duplicateDatum(datum))
        ).finally(() => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(data);
        });
    };

    // 選択中の全てのDatumが複製可能の場合にTrue
    const enabled = targets.map(target => 
        target.allowlist.copy).reduce((prevAllow, allow) => 
        prevAllow && allow
    );

    return <Button2 disabled={!enabled || readOnly}
                    onClick={() => duplicateData(targets)}>複製</Button2>;
};
