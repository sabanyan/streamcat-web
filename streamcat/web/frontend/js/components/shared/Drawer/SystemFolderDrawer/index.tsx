import React from "react"
import { FolderType } from "Model/Library";
import { Drawer2, FixedField2 } from "Shared/Input";
import { CreatorField } from "Shared/Input/CreatorField";

type Props = {
    folder: FolderType;
};

export const SystemFolderDrawer = (props:Props) => {
    const { folder } = props;

    return <Drawer2>
        <FixedField2 key={'label'}
                     label='ラベル'
                     value={folder.label} />
        <CreatorField key={'creator'} datum={folder} />
    </Drawer2>;
};
