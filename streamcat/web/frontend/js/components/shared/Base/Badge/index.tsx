import React from 'react';
import style from "./style.scss";
import classnames from "classnames";


type Props = {
    children?: string;
    color: "darkGreen" | "darkBlue";
}

const Badge = (props:Props)=>{
    const {children, color} = props;

    return <div className={classnames(style.badge,style[color])}>
        {children}
    </div>
}

export {Badge}


