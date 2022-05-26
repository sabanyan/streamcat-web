import React from "react";
import { Typography } from "@mui/material";

type Props = {
    label: string;
    items: JSX.Element[]|string[];
};

export const Array2 = (props:Props) => {
    const {label, items} = props;

    return <>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{label}</Typography>
        <div>{items.map((item, index) =>
            <Typography key={index}
                        variant='body1'
                        color='textPrimary'
                        component='span'
                        sx={{lineHeight:'1',
                            paddingLeft:1,
                            paddingBottom:1}}>{item}</Typography>
        )}</div>
    </>;
};
