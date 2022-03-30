import React from "react";
import { Button } from "@mui/material"

type Props = {
    disabled?: boolean;
    onClick: () => void;
    children: string;
};

export const Button2 = (props:Props) => {
    const {disabled, onClick, children} = props;
    return <Button disabled={disabled} onClick={onClick}>{children}</Button>;
}
