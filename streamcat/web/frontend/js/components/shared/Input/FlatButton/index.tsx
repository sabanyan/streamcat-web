import React from 'react';
import * as buttonStyle from '../Button/style.scss';
import * as style from './style.scss';
import classnames from "classnames";

type Props = {
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    children?: React.ReactNode;
    disabled?: boolean;
    icon?: string;
    danger?: boolean;
    className?: any;
    primary?: boolean;
}

export const FlatButton = (props: Props) => {
    const {onClick, children, disabled, icon, danger, className, primary} = props;
    const buttonClass = classnames(style.button, {
        [style.danger]: danger,
        [className]: (className),
        [style.primary]: primary
    });
    const baseUrl = "/front_static/";
    const iconElement = (icon)
        ? <img className={style.icon} src={baseUrl + "images/icon/" + icon + ".svg"} />
        : null;
    return <button type="button" className={buttonClass} disabled={disabled} onClick={onClick}>
        {iconElement}
        <div className={classnames({[buttonStyle.whiteText]: primary, [style.text]: !primary})}>
            {children}
        </div>
    </button>;
};
