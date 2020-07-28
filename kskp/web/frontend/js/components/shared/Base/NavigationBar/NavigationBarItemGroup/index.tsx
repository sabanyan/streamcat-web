import React from "react";

interface Props {
    children: React.ReactNode;
}

const NavigationBarItemGroup = (props: Props) => {
    const {children} = props;
    return <div className="collapse navbar-collapse breadcrumb-navbar">
        <ul className="navbar-nav mr-auto">
            {children}
        </ul>
    </div>;
};

export {NavigationBarItemGroup};
