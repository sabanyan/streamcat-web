import React from "react";
import HttpUtil from "Utils/HttpUtil";
import { DatumType, FolderType } from "Model/Library";
import { Button2 } from "Shared/Input";
import { useMoveData } from "./hooks";

type Props = {
    readOnly?:boolean;
    parent: FolderType;
    targets: DatumType[];
    onSuccess?: (targets:DatumType[]) => void;
};

export const MoveButton = (props:Props) => {
    const {readOnly, parent, targets, onSuccess} = props;

    // 移動処理の関数を取得する
    const moveData = useMoveData();

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

    const onClickMove = () => {
        // 移動先選択ダイアログを表示する
        HttpUtil.windowOpen(
            // 移動先フォルダ選択ダイアログは、現在の位置のフォルダを初期表示する
            getApiPath(parent.uuid) + '?dialog=true&mode=folder_select',
            // 選択した移動先フォルダへ移動する
            folder_uuid => moveData(targets, folder_uuid, onSuccess)
        );
    };

    // 選択中の全てのDatumが移動可能の場合にTrue
    const enabled = targets.map(target => 
        target.allowlist.move).reduce((prevAllow, allow) => 
        prevAllow && allow
    );

    return <Button2 disabled={!enabled || readOnly} onClick={onClickMove}>移動</Button2>;
};
