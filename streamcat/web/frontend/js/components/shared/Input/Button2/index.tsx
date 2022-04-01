import React from "react";
import { Button } from "@mui/material"

type Props = {
    disabled?: boolean;
    onClick: () => void;
    children: string;
};

export const Button2 = (props:Props) => {
    const {disabled, onClick, children} = props;
    return <Button  variant='outlined'
                    disabled={disabled} 
                    sx={{mr:1, mb:1}}
                    onClick={onClick}>{children}</Button>;
};
