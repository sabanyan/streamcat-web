import React from "react";
import { useStreamCatNotifications } from "Shared/Notification";
import { APIUtil2 } from "Utils/APIUtil2";
import { ProjectType, FolderType, FlowType } from "Model/Library";
import { Button2 } from "Shared/Input";

type FlowAndFolderType = ProjectType|FolderType|FlowType;

type Props = {
    readOnly?:boolean;
    targets: FlowAndFolderType[];
    onSuccess?: (targets:FlowAndFolderType[]) => void;
};

export const DownloadFlowButton = (props:Props) => {
    const {readOnly, targets, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // Datumをダウンロードする
    const downloadDatum = (datum:FlowAndFolderType) => {
        return APIUtil2.downloadFlow(datum.uuid, datum.label).then(() => {
            notifySuccess('フローをダウンロードしました', datum.label);
        }).catch((e) => {
            notifyError(`フローダウンロードエラー(${datum.label})`, e.message);
        });
    };

    // 全てのDatumをダウンロードする
    const downloadData = (data:FlowAndFolderType[]) => {
        // 全てのDatumをダウンロードした後に、イベントハンドラを呼び出す
        Promise.all(
            data.map(datum => downloadDatum(datum))
        ).finally(() => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(data);
        });
    };

    // 選択中の全てのDatumがエクスポート可能の場合にTrue
    const enabled = targets.map(target => 
        target.allowlist.export).reduce((prevAllow, allow) => 
        prevAllow && allow
    );

    return <Button2 disabled={!enabled || readOnly}
                    onClick={() => downloadData(targets)}>フローのダウンロード</Button2>;
};
