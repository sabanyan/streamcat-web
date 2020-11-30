import React from "react";

const ErrorIcon = () => {
    return <g transform={"translate(" + 46 + "," + 4 + ")"}>
        <circle r="12" stroke="white" strokeWidth={2} fill="red">
        </circle>
        <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill={"#fff"}
              style={{fontSize: "14px", fontWeight: "bold"}}>!
        </text>
    </g>;
};

export {ErrorIcon}
