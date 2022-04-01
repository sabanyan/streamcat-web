import React from "react"
import { FolderType } from "Model/Library";
import { Drawer2, FixedField2, TextField2 } from "Components/shared/Input";
import { MoveButton } from "../MoveButton";
import { DeleteButton } from "../DeleteButton";
import { EditBox } from "../EditBox";
import { DownloadFlowButton } from "../DownloadFlowButton";

type Props = {
    createMode: boolean;
    parent: FolderType;
    folder: FolderType;
    onSuccess:(newFolder:FolderType) => void;
};

export const FolderDrawer = (props:Props) => {
    const { createMode, parent, folder, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:createMode? '': folder.label, isError:createMode};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
    };

    // フォルダの新規追加処理
    const create = () => parent.createFolder(label.value);

    // フォルダの更新処理
    const update = () => folder.rename(label.value);

    return <Drawer2>
        <EditBox // 編集ロック=ONの場合は編集不可
                 createMode={createMode}
                 datum={folder}
                 values = {[label]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as FolderType)} >{[
            // ボタン
            [
                <MoveButton key={'move'}
                            parent={parent} 
                            targets={[folder]}
                            onSuccess={(data)=>onSuccess(data[0] as FolderType)} />,
                <DeleteButton key={'del'}
                              targets={[folder]}
                              onSuccess={(data)=>onSuccess(data[0] as FolderType)} />,
                <DownloadFlowButton key={'download'}
                                    targets={[folder]} />
            ],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key={'label'}
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <FixedField2 key={'creator'}
                             label='作成者'
                             value={folder.creator} />,
                <FixedField2 key={'createdAt'}
                             label='作成日時'
                             value={folder.createdAt} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
