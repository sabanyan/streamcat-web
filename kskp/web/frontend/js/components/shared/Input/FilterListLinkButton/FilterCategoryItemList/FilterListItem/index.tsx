import * as React from "react";
import style from "./style.scss";
import classnames from "classnames";
import ImageUtil from "Utils/ImageUtil";
import {useState} from "react";

interface Props {
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onChecked: (checked: boolean) => void;
    children: string;
    multiple: boolean;
    selected?: boolean;
    checked?: boolean;
}

const FilterListItem = (props: Props) => {
    const {onClick, children, multiple, selected, checked, onChecked} = props;
    if (multiple) {
        return <div className={style.listItemMultiple} onClick={() => onChecked(!checked)}>
            <div className={style.listItemLabel}>{children}</div>
            {
                (checked) ?
                    ImageUtil.getIconElement("icon-checkbox-on")
                    :
                    ImageUtil.getIconElement("icon-checkbox-off")
            }
        </div>;
    } else {
        return <div className={style.listItem} onClick={onClick}>
            <div className={style.listItemLabel}>{children}</div>
            {
                (selected) ?
                    ImageUtil.getIconElement("icon-done")
                    :
                    null
            }
        </div>
    }


};

export {FilterListItem};
