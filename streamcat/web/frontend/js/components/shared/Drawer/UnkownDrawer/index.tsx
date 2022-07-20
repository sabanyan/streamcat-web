import React from "react"
import { Box } from "@mui/material";
import { FolderType, DatumType } from "Model/Library";
import { Drawer2, FixedField2 } from "Shared/Input";
import { MoveButton } from "Shared/Button/MoveButton";
import { DeleteButton } from "Shared/Button/DeleteButton";
import { CreatorField } from "Shared/Input/CreatorField";

type Props = {
    parent: FolderType;
    datum: DatumType;
    onSuccess?: (data:DatumType[]) => void;
};

export const UnkownDrawer = (props:Props) => {
    const { parent, datum, onSuccess } = props;

    return <Drawer2>
        <Box>
            <MoveButton key={'move'}
                        parent={parent}
                        targets={[datum]}
                        onSuccess={onSuccess} />
            <DeleteButton key={'del'}
                          targets={[datum]}
                          onSuccess={onSuccess} />
        </Box>
        <FixedField2 key={'label'}
                     label='ラベル'
                     value={datum.label} />
        <CreatorField key={'creator'} datum={datum} />
    </Drawer2>;
};
