import React from "react";
import {NavigationModelProps} from "Model/index";

interface Props {
    navigation?: NavigationModelProps;
    children: React.ReactNode;
    visible?: boolean;
}

const baseUrl = "/front_static/";
const NavigationBarUserMenuItem = (props: Props) => {
    const {navigation, children, visible} = props;
    if (!visible || !navigation) return null;
    return <li className="nav-item dropdown user">
        <a className="nav-link dropdown-toggle" id="navbarDropdownMenuLink" data-toggle="dropdown"
           aria-haspopup="true" aria-expanded="false">
            <img className="icon" src={baseUrl + "images/icon/user.svg"} />
            {navigation.user_name}
        </a>
        <div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
            {children}
        </div>
    </li>;
};

export {NavigationBarUserMenuItem};
