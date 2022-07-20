import React from "react"
import { Box } from "@mui/material";
import { TrashType } from "Model/Library";
import { Drawer2, FixedField2 } from "Shared/Input";
import { TrashAllButton } from "Shared/Button/TrashAllButton";
import { CreatorField } from "Shared/Input/CreatorField";

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
        <CreatorField key={'creator'} datum={trashFolder} />
    </Drawer2>;
};
