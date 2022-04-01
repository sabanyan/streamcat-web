import React from "react"
import { FolderType } from "Model/Library";
import { Drawer2, FixedField2 } from "Components/shared/Input";

type Props = {
    folder: FolderType;
};

export const SystemFolderDrawer = (props:Props) => {
    const { folder } = props;

    return <Drawer2>
        <FixedField2 key={'label'}
                     label='ラベル'
                     value={folder.label} />
        <FixedField2 key={'creator'}
                     label='作成者'
                     value={folder.creator} />
        <FixedField2 key={'createdAt'}
                     label='作成日時'
                     value={folder.createdAt} />
    </Drawer2>;
};
