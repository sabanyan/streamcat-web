import React from "react";
import { useAsyncResource } from "use-async-resource";
import { DatumType } from "Model/Library";
import { MultiSelect2 } from "Shared/Input";
import { SelectItem } from "Shared/Input/Select2";
import { Value as MultiValue } from 'Shared/Input/MultiSelect2';
import { UserAPI } from "Utils/UserAPI";

type Props = {
    readOnly?:boolean;
    visible?: boolean;
    ownerState:  [MultiValue<SelectItem>, (value:React.SetStateAction<MultiValue<SelectItem>>)=>void];
    editorState: [MultiValue<SelectItem>, (value:React.SetStateAction<MultiValue<SelectItem>>)=>void];
    readerState: [MultiValue<SelectItem>, (value:React.SetStateAction<MultiValue<SelectItem>>)=>void];
    onErrorChange?: (isError:boolean) => void;
    onSuccess?: (targets:DatumType[]) => void;
};

// useAsyncResourceに渡す関数はコンポーネントの外で定義しないと
// useAsyncResourceのキャッシュが機能しない
const getAllUsers = () => UserAPI.findUsers('', true)

export const MembersSelect = (props:Props) => {
    const {readOnly, visible, onErrorChange} = props;
    const [owners, setOwners] = props.ownerState;
    const [editors, setEditors] = props.editorState;
    const [readers, setReaders] = props.readerState;

    // ここで全ユーザの取得を開始する
    const [usersReader] = useAsyncResource(getAllUsers, []);

    // 取得した全ユーザをキャッシュする
    const allUsers = React.useMemo(
        () => usersReader().map((user):SelectItem => ({
            label: user.name,
            value: user.uuid
        })),
        []
    );

    // 選択肢の比較関数
    const isEaual = (item:SelectItem, value:SelectItem) => item.value===value.value;

    // 他のプロジェクトロールのメンバに設定されている選択肢は選択不可にする
    const isDisabledItem = (item:SelectItem,
                            disabledItems1:SelectItem[],
                            disabledItems2:SelectItem[]) => {
        return disabledItems1.some(disabledItem => isEaual(item, disabledItem)) ||
               disabledItems2.some(disabledItem => isEaual(item, disabledItem));
    };

    return visible?
        <>
            <MultiSelect2<SelectItem>
                label='プロジェクト管理者'
                readOnly={readOnly}
                required={true}
                requiredMessage='1人以上のプロジェクト管理者を設定してください'
                readOnlyLayout='list'
                items={allUsers}
                state={[owners, setOwners]}
                isEqual={isEaual}
                isDisabledItem={item => isDisabledItem(item, editors.value, readers.value)}
                getLabel={owner=>owner.label}
                onErrorChange={onErrorChange}/>
            <MultiSelect2<SelectItem>
                label='編集者'
                readOnly={readOnly}
                readOnlyLayout='list'
                items={allUsers}
                state={[editors, setEditors]}
                isEqual={isEaual}
                isDisabledItem={item => isDisabledItem(item, owners.value, readers.value)}
                getLabel={owner=>owner.label}/>
            <MultiSelect2<SelectItem>
                label='閲覧者'
                readOnly={readOnly}
                readOnlyLayout='list'
                items={allUsers}
                state={[readers, setReaders]}
                isEqual={isEaual}
                isDisabledItem={item => isDisabledItem(item, owners.value, editors.value)}
                getLabel={owner=>owner.label}/>
        </>:
            // プロジェクトメンバの表示権限がない場合は何も表示しない
            <></>;
};
