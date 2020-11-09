import React from "react";

interface Props {
    height?: number | string;
    width?: number | string;
    minWidth?: number | string;
}

const Spacer = (props:Props) => {
    const {width, height, minWidth} = props;
    return <div style={{width: width, minWidth: minWidth, height: height, display: (width !== undefined) ? "inline-block" : "block"}} />;
};

export {Spacer};
