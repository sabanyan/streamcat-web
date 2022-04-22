import React from "react"
import { Box } from "@mui/material"
import { FixedField2 } from "Components/shared/Input"
import { DatumType } from "Model/Library";

type Props = {
    datum: DatumType;
};

export const CreatorField = (props:Props) => {
    const {datum} = props;

    return <Box sx={{position:'fixed', bottom:10}}>
        <FixedField2 label='作成者'   value={datum.creator} />
        <FixedField2 label='作成日時' value={datum.createdAt} />
    </Box>;
};
