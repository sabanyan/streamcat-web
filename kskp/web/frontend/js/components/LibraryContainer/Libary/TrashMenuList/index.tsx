import * as React from "react";
import * as style from "./style.scss";
import {FlatButton} from "Shared/Input";

interface Props {
    onClickDeleteAll: () => void;
}

const TrashMenuList = (props: Props) => {
    const {onClickDeleteAll} = props;

    return <div className={style.menuList}>
        <FlatButton icon={"icon-trash"} danger={true} onClick={onClickDeleteAll}>ゴミ箱を空にする</FlatButton>
    </div>;
};

export {TrashMenuList};
