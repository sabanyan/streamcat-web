//@flow
import React from 'react'
import style from 'Shared/Input/Button/style.scss'
import classnames from 'classnames'

export type Props = {
    onClick: React.MouseEventHandler<HTMLAnchorElement>;
    children: string;
    disabled: boolean;
    icon: string;
    danger?: boolean;
    href?: string;
    download: boolean;
};

export const DownloadButton = (props: Props) => {
    const {onClick, children, disabled, icon, danger, href, download} = props;
    const icon_class = classnames('material-icons', [style.icon])
    const material_icon = (icon)
        ? <i className={icon_class} dangerouslySetInnerHTML={{__html: icon}}></i>
        : null
    return <a download={(!disabled)?download:null} href={(!disabled)?href:undefined}
                target="_blank"
                className={classnames(style.button, {[style.danger]: danger,[style.disabled]: disabled})}
                onClick={(!disabled)?onClick:()=>{}}>
        {material_icon}
        <div className={style.text}>
        {children}
        </div>
    </a>;
};
