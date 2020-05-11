import React from "react";

type Props = {
    height?: number,
    width?: number
}

const Spacer = (props:Props) => {
    const {width, height} = props;
    return <div style={{width: width, height: height, display: (width !== undefined) ? "inline-block" : "block"}} />;
};

export {Spacer};
