import React from "react";
import { useStreamCatNotifications } from "Shared/Notification";
import { Api } from 'Api';
import { FrameType } from "Model/Library";
import { Button2 } from "Shared/Input";

type Props = {
    readOnly?:boolean;
    targets: FrameType[];
    onSuccess?: (targets:FrameType[]) => void;
};

export const DownloadCsvButton = (props:Props) => {
    const {readOnly, targets, onSuccess} = props;

    // 通知ダイアログ
    const {notifySuccess, notifyError} = useStreamCatNotifications();

    // Frameをダウンロードする
    const downloadFrame = (frame:FrameType) => {
        return Api.downloadFrame(frame.uuid, frame.label).then(() => {
            notifySuccess('CSVをダウンロードしました', frame.label);
        }).catch((e) => {
            notifyError(`CSVダウンロードエラー(${frame.label})`, e.message);
        });
    };

    // 全てのFrameをダウンロードする
    const downloadFrames = (frames:FrameType[]) => {
        // 全てのFrameをダウンロードした後に、イベントハンドラを呼び出す
        Promise.all(
            frames.map(frame => downloadFrame(frame))
        ).finally(() => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(frames);
        });
    };

    // 選択中の全てのFrameがダウンロード可能の場合にTrue
    const enabled = targets.map(target => 
        target.allowlist.download).reduce((prevAllow, allow) => 
        prevAllow && allow
    );

    return <Button2 disabled={!enabled || readOnly}
                    onClick={() => downloadFrames(targets)}>CSVダウンロード</Button2>;
};
