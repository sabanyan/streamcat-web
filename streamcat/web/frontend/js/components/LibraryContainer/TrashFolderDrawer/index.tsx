import React from "react"
import { Box } from "@mui/material";
import { TrashType } from "Model/Library";
import { Drawer2, FixedField2 } from "Components/shared/Input";
import { TrashAllButton } from "../TrashAllButton";

type Props = {
    trashFolder: TrashType;
};

export const TrashFolderDrawer = (props:Props) => {
    const { trashFolder } = props;

    return <Drawer2>
        <Box>
            <TrashAllButton trashFolder={trashFolder} />
        </Box>
        <FixedField2 key={'label'}
                     label='ラベル'
                     value={trashFolder.label} />
        <FixedField2 key={'creator'}
                     label='作成者'
                     value={trashFolder.creator} />
        <FixedField2 key={'createdAt'}
                     label='作成日時'
                     value={trashFolder.createdAt} />
    </Drawer2>;
};
