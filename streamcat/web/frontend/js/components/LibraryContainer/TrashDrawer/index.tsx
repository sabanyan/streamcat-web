import React from "react"
import { Box } from "@mui/material";
import { Drawer2, FixedField2 } from "Components/shared/Input";
import { DatumType, TrashType } from "Model/Library";
import { MoveButton } from "../MoveButton";
import { PutbackButton } from "../PutbackButton";
import { CreatorField } from "../CreatorField";

type Props = {
    trashFolder: TrashType;
    datum: DatumType;
    onSuccess?: (data:DatumType[]) => void;
};

export const TrashDrawer = (props:Props) => {
    const { trashFolder, datum, onSuccess } = props;

    return <Drawer2>
        <Box>
            <PutbackButton key={'putback'}
                        trashFolder={trashFolder}
                        datum={datum}
                        onSuccess={datum => onSuccess && onSuccess([datum])}/>
            <MoveButton key={'move'}
                        parent={trashFolder}
                        targets={[datum]}
                        onSuccess={onSuccess} />
        </Box>
        <FixedField2 key={'label'}
                     label='ラベル'
                     value={datum.label} />
        <FixedField2 key={'prevFolderPath'}
                     label='捨てる前の場所'
                     value={datum.prevFolderPath || ''} />
        <CreatorField key={'creator'} datum={datum} />
    </Drawer2>;
};
