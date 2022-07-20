import React from 'react';
import { FolderType } from 'Model/Library';
import { DialogButton, TextField2 } from 'Shared/Input';
import { EditBox } from 'Shared/Base/EditBox';

type Props = {
    parent:FolderType;
    onSuccess:(newFolder:FolderType) => void;
};

/**
 * フォルダの追加ボタン
 * @param props 
 */
export const CreateFolderButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:'', isError:true};
    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
    };

    // フォルダの新規追加処理
    const create = () => parent.createFolder(label.value);

    return <DialogButton label='フォルダの追加'
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox
                key='createFolder'
                // 編集ロック=ONの場合は編集不可
                createMode={true}
                values = {[label]}
                initValues={initValues}
                create={create}
                onSuccess={newFolder => {
                    onSuccess(newFolder as FolderType);
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyPress) => [
                    <TextField2 key={'label'}
                                label='ラベル'
                                required={true}
                                readOnly={readOnly}
                                autoFocus={true}
                                state={[label, setLabel]}
                                onErrorChange={onErrorChange}
                                onEnterKeyPress={onEnterKeyPress} />
                ]
            ]}</EditBox>
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
