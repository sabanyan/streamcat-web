import * as React from "react";

export default class ImageUtil {
    static getIconElement(iconName:string):React.ReactNode{
        const baseUrl = '/front_static/';
        const icon = iconName;
        const style = {
            marginRight: "16px",
            position: "relative" as "relative",
            top: "-1px"
        };
        return <img style={style} src={baseUrl + 'images/icon/' + icon + '.svg'}/>;
    };
}
