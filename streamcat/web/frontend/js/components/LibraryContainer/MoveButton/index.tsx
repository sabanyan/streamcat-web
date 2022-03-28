import React from "react";
import { Button } from "@mui/material";
import { APIUtil2 } from "Utils/APIUtil2";
import { useStreamCatNotifications } from "Components/shared/Notification";
import HttpUtil from "Utils/HttpUtil";
import LibraryUtil from "Utils/LibraryUtil";
import { DatumType, FolderType } from "Model/Library";

type Props = {
    parent: FolderType;
    target: DatumType;
    onSuccess?: (target:DatumType) => void;
};

export const MoveButton = (props:Props) => {
    const {parent, target, onSuccess} = props;

    const {notifySuccess, notifyError} = useStreamCatNotifications();

    const getApiPath = (uuid:string):string => {
        if(inject_folder_uuid || inject_is_trash){
            // ルートフォルダ以外の場合
            return {
                project:`projects/${uuid}`,
                folder: `folders/${uuid}`,
                trash:  `trashes`
            }[parent.type];
        }else{
            // ルートフォルダの場合
            return `library`;
        }
    };

    const moveDatum = (datum:DatumType, newParent:string) => {
        let promise: Promise<DatumType>;
        if (datum.type === 'flow') {
            // Flowの場合は、Lockを取得してから移動する
            promise = APIUtil2.createLock(datum.uuid).then(lock => {
                // Datumを移動する
                return datum.move(newParent, lock.uuid).finally(() => {
                    // Flowの移動が完了した後に、Lockを解除する
                    lock.delete();
                });
            });
        }else{
            // Datumを移動する
            promise = datum.move(newParent); 
        }
        // 移動完了メッセージを表示する
        return promise.then(datum => {
            const typeLabel = LibraryUtil.getTypeLabel(datum.type);
            notifySuccess(typeLabel + 'を移動しました', datum.label);
            // イベントハンドラを呼び出す
            onSuccess && onSuccess(datum);
        }).catch((e) => {
            notifyError(`ライブラリー移動エラー(${datum.label})`, e.message);
        });
    };

    const onClickMove = () => {
        // 移動先選択ダイアログを表示する
        HttpUtil.windowOpen(
            // 移動先フォルダ選択ダイアログは、現在の位置のフォルダを初期表示する
            getApiPath(parent.uuid) + '?dialog=true&mode=folder_select',
            (folder_uuid) => {
                // setIsLoading(true);
                // selectedDatas.forEach((selectedData: DatumType) => {
                //     queue.push(moveLibrary, [selectedData, folder_uuid, lock]);
                // });
                // queue.push(setIsLoading, [false]);
                // queue.push(fetchFolder, []);
                // queue.start();
                moveDatum(target, folder_uuid);
            }
        );
    };

    return <Button onClick={onClickMove}>移動する</Button>;
}