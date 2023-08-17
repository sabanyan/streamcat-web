import React from 'react';
import { useStreamCatNotifications } from 'Shared/Notification';
import { Api } from 'Api';
import { FrameType, DocumentType } from 'Model/Library';
import { Button2 } from 'Shared/Input';

type FrameOrDocumentType = FrameType|DocumentType;

type Props = {
    readOnly?: boolean;
    targets: FrameOrDocumentType[];
    onSuccess?: (targets:FrameOrDocumentType[]) => void;
};

export const DownloadFileButton = (props:Props) => {
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

    // Documentをダウンロードする
    const downloadDocument = (document:DocumentType) => {
        return Api.downloadDocument(document.uuid, document.label).then(() => {
            notifySuccess('ファイルをダウンロードしました', document.label);
        }).catch((e) => {
            notifyError(`ファイルダウンロードエラー(${document.label})`, e.message);
        });
    };

    // 全てのFrame/Documentをダウンロードする
    const downloadFrames = (data:FrameOrDocumentType[]) => {
        // 全てのFrame/Documentをダウンロードした後に、イベントハンドラを呼び出す
        Promise.all(
            data.map(datum => {
                if(datum.type==='frame'){
                    return downloadFrame(datum as FrameType);
                }else{
                    return downloadDocument(datum as DocumentType);
                }
            })
        ).finally(() => {
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(data);
        });
    };

    // 選択中の全てのFrameがダウンロード可能の場合にTrue
    const enabled = targets.map(target => 
        target.allowlist.download).reduce((prevAllow, allow) => 
        prevAllow && allow
    );

    return <Button2 disabled={!enabled || readOnly}
                    onClick={() => downloadFrames(targets)}>ダウンロード</Button2>;
};
