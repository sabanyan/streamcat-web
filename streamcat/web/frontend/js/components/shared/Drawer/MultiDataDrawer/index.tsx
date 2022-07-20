import React from "react"
import { Drawer2 } from "Shared/Input";
import { DatumType, FolderType } from "Model/Library";
import { MoveButton } from "Shared/Button/MoveButton";
import { DeleteButton } from "Shared/Button/DeleteButton";

type Props = {
    parent: FolderType;
    data: DatumType[];
    onSuccess: (data:DatumType[]) => void;
};

export const MultiDataDrawer = (props:Props) => {
    const { parent, data, onSuccess } = props;

    const allAreFlows = data.every(datum => datum.type === 'flow');

    return <Drawer2>
        <MoveButton parent={parent} targets={data} onSuccess={onSuccess} />
        <DeleteButton targets={data} onSuccess={onSuccess} />
        {
            allAreFlows?
            <p>全てフロー</p>:
            <></>
        }
    </Drawer2>;
};
