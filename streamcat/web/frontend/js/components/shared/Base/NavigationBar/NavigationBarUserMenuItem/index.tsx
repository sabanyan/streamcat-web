import React from "react";
import {NavigationType} from "Model/Navigation/NavigationModel";

interface Props {
    navigation: NavigationType | null;
    children?: React.ReactNode;
    visible?: boolean;
}

const baseUrl = "/front_static/";
const NavigationBarUserMenuItem = (props: Props) => {
    const {navigation, children, visible} = props;
    if (!visible || !navigation) return null;
    return <li className="dropdown user">
        <a className="nav-link dropdown-toggle" id="navbarDropdownMenuLink" data-toggle="dropdown"
           aria-haspopup="true" aria-expanded="false">
            <img className="icon" src={baseUrl + "images/icon/user.svg"} />
            {navigation.user.name}
        </a>
        <div className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
            {children}
        </div>
    </li>;
};

export {NavigationBarUserMenuItem};
