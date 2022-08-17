import React from "react";
import { List, ListItemText, Typography } from "@mui/material";

type Props = {
    label: string;
    items: JSX.Element[]|string[];
};

export const List2 = (props:Props) => {
    const {label, items} = props;

    return <>
        <Typography variant='caption'
                    color='textSecondary'
                    sx={{lineHeight:'0'}}>{label}</Typography>
        <List disablePadding={true}
              color="textPrimary"
              sx={{ lineHeight:'0',
                    paddingLeft:1,
                    paddingTop:0,
                    paddingBottom:0}} >{
            items.map((item, index) =>
                <ListItemText key={index}>{item}</ListItemText>
            )
        }</List>
    </>;
};
