import React from "react";
import { Rect } from "Shared/SVG";
import {RectStyle} from "Shared/SVG/Node";

type Props = {
    hover?: boolean;
    selected?: boolean;
    filter?: string;
    style?: any;
}

class DataDstIcon extends React.Component<Props> {

    render() {
        const { hover, selected, filter, style } = this.props;
        const baseUrl = "/front_static/";
        const src = baseUrl + "images/icon/icon-data-dst.svg";
        const defaultStyle =  {...RectStyle, rx: 12, ry: 12 }

        return (
            <Rect selectedOutlineColor={"#93DFFF"} fillColor={"#FFFFFF"}
                hoverFillColor={"#E8F8FF"} selectedFillColor={"#E8F8FF"}
                hover={hover} selected={selected} stroke={"#63CFFD"}
                filter={filter} style={style ? style : defaultStyle}>
                <image href={src} x="5" y="5" height="40" width="40" />
            </Rect>
        );
    }
}

export { DataDstIcon }