import * as React from "react";
import * as style from "./style.scss";
import {Spacer} from "Shared/Base";
import {FlatButton} from "Shared/Input";

interface Props {
    onClickNewUser: () => void;
}

const MenuList = (props: Props) => {
    const {onClickNewUser} = props;

    return <div className={style.menuList}>
        <FlatButton icon={"icon-add"} onClick={onClickNewUser}>ユーザの新規作成</FlatButton>
    </div>;
};

export {MenuList};
