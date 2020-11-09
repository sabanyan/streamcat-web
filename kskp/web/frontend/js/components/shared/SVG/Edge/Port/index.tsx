import React from "react";
import style from "../style.scss";

type Props = {
    x: number;
    y: number;
}

const Port = (props: Props) => {
    const {x, y} = props;
    return <circle className={style.port} cx={x} cy={y} r={6} />;
};

export {Port};
