import React from "react";

interface Props {
    children: React.ReactNode;
}

const NavigationBarMenuGroup = (props: Props) => {
    const {children} = props;
    return <div className="menu-navbar">
        <ul className="navbar-nav">
            {children}
        </ul>
    </div>;
};

export {NavigationBarMenuGroup};
