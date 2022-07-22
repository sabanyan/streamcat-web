import React from "react"
import { FolderType, FlowType } from "Model/Library";
import { Drawer2, TextField2 } from "Shared/Input";
import { MoveButton } from "Shared/Button/MoveButton";
import { DeleteButton } from "Shared/Button/DeleteButton";
import { EditBox } from "Shared/Base/EditBox";
import { EditLockCheckbox } from "Shared/Input/EditLockCheckbox";
import { DuplicateButton } from "Shared/Button/DuplicateButton";
import { DownloadFlowButton } from "Shared/Button/DownloadFlowButton";
import { CreatorField } from "Shared/Input/CreatorField";
import { Api } from 'Api';

type Props = {
    createMode: boolean;
    parent: FolderType;
    flow: FlowType;
    onSuccess:(newFlow:FlowType) => void;
};

export const FlowDrawer = (props:Props) => {
    const { createMode, parent, flow, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:createMode? '': flow.label, isError:createMode};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
    };

    // フローの新規追加処理
    const create = () => parent.createFlow(label.value);

    // フローの更新処理
    const update = () => Api.createLock(flow.uuid).then(lock =>
        flow.rename(label.value, lock.uuid).finally(() =>
            lock.delete()
        )
    );

    return <Drawer2>
        <EditBox // 編集ロック=ONの場合は編集不可
                 readOnly={flow.editLock}
                 createMode={createMode}
                 datum={flow}
                 values = {[label]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as FlowType)} >{[
            // ボタン
            [
                <MoveButton key='move'
                            parent={parent} 
                            targets={[flow]}
                            onSuccess={(data)=>onSuccess(data[0] as FlowType)} />,
                <DeleteButton key='del'
                              targets={[flow]}
                              onSuccess={(data)=>onSuccess(data[0] as FlowType)} />,
                <DuplicateButton key='duplicate'
                                 targets={[flow]}
                                 onSuccess={(data)=>onSuccess(data[0] as FlowType)} />,
                <DownloadFlowButton key='download'
                                    targets={[flow]} />,
                <EditLockCheckbox key='editLock'
                                  target={flow}
                                  // 編集ロックの値はこのコンポーネント内では保持しない
                                  state={[{value:flow.editLock,isError:false}, ()=>{}]}
                                  onChange={(updated)=>onSuccess(updated)} />
            ],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key='label'
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <CreatorField key='creator' datum={flow} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
