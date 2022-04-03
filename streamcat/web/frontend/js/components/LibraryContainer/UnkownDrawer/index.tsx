import React from "react"
import { Box } from "@mui/material";
import { FolderType, DatumType } from "Model/Library";
import { Drawer2, FixedField2 } from "Components/shared/Input";
import { MoveButton } from "../MoveButton";
import { DeleteButton } from "../DeleteButton";

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
        <FixedField2 key={'creator'}
                     label='作成者'
                     value={datum.creator} />
        <FixedField2 key={'createdAt'}
                     label='作成日時'
                     value={datum.createdAt} />
    </Drawer2>;
};
