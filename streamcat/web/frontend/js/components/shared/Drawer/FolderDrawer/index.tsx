import React from 'react'
import { FolderType } from 'Model/Library';
import { Drawer2, TextField2 } from 'Shared/Input';
import { MoveButton } from 'Shared/Button/MoveButton';
import { DeleteButton } from 'Shared/Button/DeleteButton';
import { EditBox } from 'Shared/Base/EditBox';
import { DuplicateButton } from 'Shared/Button/DuplicateButton';
import { DownloadFlowButton } from 'Shared/Button/DownloadFlowButton';
import { CreatorField } from 'Shared/Input/CreatorField';

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
            (readonly) => readonly? [
                <MoveButton key='move'
                            parent={parent} 
                            targets={[folder]}
                            onSuccess={(data)=>onSuccess(data[0] as FolderType)} />,
                <DuplicateButton key='duplicate'
                                 targets={[folder]}
                                 onSuccess={(data)=>onSuccess(data[0] as FolderType)} />,
                <DeleteButton key='del'
                              targets={[folder]}
                              onSuccess={(data)=>onSuccess(data[0] as FolderType)} />,
                <DownloadFlowButton key='download'
                                    targets={[folder]} />
            ]: [],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key='label'
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <CreatorField key='creator' datum={folder} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
