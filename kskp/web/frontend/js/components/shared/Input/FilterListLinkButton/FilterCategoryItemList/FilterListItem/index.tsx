import * as React from "react";
import style from "./style.scss";
import classnames from "classnames";

interface Props {
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    children: string;
    multi: boolean;
}

const FilterListItem = (props: Props) => {
    const {onClick, children,multi} = props;
    return <div className={style.listItem} onClick={onClick}>
        {(multi)?"[*]":""}
        {children}
    </div>;
};

export {FilterListItem};
