import * as React from "react";
import Index from "Shared/SVG/Shadow";
import Constants from "Constants/index";
import style from "./style.scss";
import {ZoomUtil} from "Utils/index";
import {GraphType} from "Types/index";

type Props = {
    zoom: number;
    graph: GraphType;
    children: React.ReactNode;
}

const Paper = (props: Props) => {
    const {zoom, graph, children} = props;

    const paperWidth = graph.width + Constants.paper.padding.right;
    const paperHeight = graph.height + Constants.paper.padding.bottom;
    const viewWidth = ZoomUtil.zoomReverse(paperWidth, zoom);
    const viewHeight = ZoomUtil.zoomReverse(paperHeight, zoom);

    if (!paperWidth || !paperHeight) return null;

    return <svg className={style.paper} width={paperWidth} height={paperHeight}
                viewBox={"0 0 " + viewWidth + " " + viewHeight}>
        <Index />
        {children}
    </svg>;
};

export {Paper};
