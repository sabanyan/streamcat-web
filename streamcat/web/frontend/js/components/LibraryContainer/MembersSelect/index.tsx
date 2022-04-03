import React from "react";
import { useAsyncResource } from "use-async-resource";
import { DatumType } from "Model/Library";
import { APIUtil2 } from "Utils/APIUtil2";
import { MultiSelect2 } from "Components/shared/Input";
import { SelectItem } from "Components/shared/Input/Select2";

type Props = {
    readOnly?:boolean;
    visible?: boolean;
    ownerState?:  [SelectItem[], (value:React.SetStateAction<SelectItem[]>)=>void];
    editorState?: [SelectItem[], (value:React.SetStateAction<SelectItem[]>)=>void];
    readerState?: [SelectItem[], (value:React.SetStateAction<SelectItem[]>)=>void];
    onSuccess?: (targets:DatumType[]) => void;
};

// useAsyncResourceに渡す関数はコンポーネントの外で定義しないと
// useAsyncResourceのキャッシュが機能しない
const getAllUsers = () => APIUtil2.findUsers('', true)

export const MembersSelect = (props:Props) => {
    const {readOnly, visible} = props;
    const [owners, setOwners] = props.ownerState || [[], () => {}];
    const [editors, setEditors] = props.editorState || [[], () => {}];
    const [readers, setReaders] = props.readerState || [[], () => {}];

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
                items={allUsers}
                state={[owners, setOwners]}
                isEqual={isEaual}
                isDisabledItem={item => isDisabledItem(item, editors, readers)}
                getLabel={owner=>owner.label}/>
            <MultiSelect2<SelectItem>
                label='編集者'
                readOnly={readOnly}
                items={allUsers}
                state={[editors, setEditors]}
                isEqual={isEaual}
                isDisabledItem={item => isDisabledItem(item, owners, readers)}
                getLabel={owner=>owner.label}/>
            <MultiSelect2<SelectItem>
                label='閲覧者'
                readOnly={readOnly}
                items={allUsers}
                state={[readers, setReaders]}
                isEqual={isEaual}
                isDisabledItem={item => isDisabledItem(item, owners, editors)}
                getLabel={owner=>owner.label}/>
        </>:
            // プロジェクトメンバの表示権限がない場合は何も表示しない
            <></>;
};
