import React from "react";

interface Props {
    iconUrl: string;
    href: string;
    children: string;
}

const NavigationBarItem = (props: Props) => {
    const {href, iconUrl, children} = props;
    return <li className="nav-item library">
        <a className="nav-link" href={href}>
            {(iconUrl) ?
                <img className="icon" src={iconUrl} />
                : null}
            {children}
        </a>
    </li>;
};

export {NavigationBarItem};
