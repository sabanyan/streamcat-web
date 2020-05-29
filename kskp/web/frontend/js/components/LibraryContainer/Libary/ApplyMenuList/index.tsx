import * as React from "react";
import * as style from "./style.scss";
import {FlatButton} from "Shared/Input";

interface Props {
    onClickApply: () => void;
}

const ApplyMenuList = (props: Props) => {
    const {onClickApply} = props;

    return <div className={style.menuList}>
        <FlatButton icon={""} danger={false} onClick={onClickApply}>移動する</FlatButton>
    </div>;
};

export {ApplyMenuList};
