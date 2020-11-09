import React from "react";

interface Props {
    children: React.ReactNode;
}

const NavigationBarGroup = (props: Props) => {
    const {children} = props;
    return <nav className="navbar navbar-expand navbar-dark fixed-top">
        {children}
    </nav>;
};

export {NavigationBarGroup};
