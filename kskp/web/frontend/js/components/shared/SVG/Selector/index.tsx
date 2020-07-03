import * as React from "react";
import style from "./style.scss";

interface Props {
    sx: number,
    sy: number,
    ex: number,
    ey: number
}

const Selector = (props: Props) => {
    const {sx, sy, ex, ey} = props;
    return <g>
        <path className={style.selector}
              d={"M" + sx + "," + sy + " " + "L" + ex + "," + sy + " " + ex +
              "," + ey + " " + sx + "," + ey + " z"} fill="none" />
    </g>;
};
export {Selector};
