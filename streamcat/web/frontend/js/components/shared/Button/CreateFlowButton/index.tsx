import React from 'react';
import { FolderType, FlowType } from 'Model/Library';
import { DialogButton, TextField2 } from 'Shared/Input';
import { EditBox } from 'Shared/Base/EditBox';

type Props = {
    parent:FolderType;
    onSuccess:(newFlow:FlowType) => void;
};

/**
 * フローの追加ボタン
 * @param props 
 */
export const CreateFlowButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:'', isError:true};
    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
    };

    // フローの新規追加処理
    const create = () => parent.createFlow(label.value);

    return <DialogButton label='フローの追加'
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox
                key='createFlow'
                // 編集ロック=ONの場合は編集不可
                createMode={true}
                values = {[label]}
                initValues={initValues}
                create={create}
                onSuccess={newFlow => {
                    onSuccess(newFlow as FlowType);
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                () => [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyPress) => [
                    <TextField2 key='label'
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
