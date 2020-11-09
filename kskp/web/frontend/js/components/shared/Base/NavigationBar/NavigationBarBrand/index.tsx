import React from "react";

const baseUrl = "/front_static/";
const NavigationBarBrand = () => {
    return <a className="navbar-brand">
        <img src={baseUrl + "images/logo.png"} className="d-inline-block align-top"
             alt="" />
    </a>;
};

export {NavigationBarBrand};
