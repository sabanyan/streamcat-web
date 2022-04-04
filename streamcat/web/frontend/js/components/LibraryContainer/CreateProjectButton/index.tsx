import React from 'react';
import { FolderType, ProjectType } from 'Model/Library';
import { DialogButton, TextField2 } from 'Components/shared/Input';
import { EditBox } from '../EditBox';

type Props = {
    parent:FolderType;
    onSuccess:(newProject:ProjectType) => void;
};

/**
 * プロジェクトの追加ボタン
 * @param props 
 */
export const CreateProjectButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:'', isError:true};
    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
    };

    // プロジェクトの新規追加処理
    const create = () => parent.createProject(label.value);

    return <DialogButton label={'プロジェクトの追加'}
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox
                key='createProject'
                // 編集ロック=ONの場合は編集不可
                createMode={true}
                values = {[label]}
                initValues={initValues}
                create={create}
                onSuccess={newProject => {
                    onSuccess(newProject as ProjectType);
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
