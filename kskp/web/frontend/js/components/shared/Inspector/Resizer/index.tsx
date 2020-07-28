import * as React from "react";
import {useEffect, useState} from "react";
import style from "../style.scss";
import classnames from "classnames";
import {InspectorKnob} from "Shared/Inspector";
import Constants from "Constants/index";
import {HttpUtil} from "Utils/index";

let mouseMoveEvent;
let mouseUpEvent;

type Props = {
    children: React.ReactNode;
    inspector?: { width: number };

    resizeInspector?: Function
}

const Resizer = (props: Props) => {

    const [isDragging, setIsDragging] = useState<boolean>(false);

    const [isClosed, setIsClosed] = useState<boolean>(false);

    const [willClosed, setWillClosed] = useState<boolean>(false);

    const [width, setWidth] = useState<number>(Constants.default.inspector.width);

    useEffect(()=>{
        const {resizeInspector} = props;
        if(isDragging){
            if (isClosed) {
                let width = Constants.default.inspector.width;
                setIsClosed(false);
                setWillClosed(false);
                setWidth(width);

                //　redux 使うケース（FlowEditor)
                if (resizeInspector) resizeInspector(width);
            }
        }
    },[isDragging]);


    useEffect(()=>{
        const {resizeInspector} = props;
        if (resizeInspector) resizeInspector(width);
    },[width])

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        //mousemoveイベントでハンドリング
        mouseMoveEvent = (e: React.MouseEvent) => onMouseMove(e);
        mouseUpEvent = (e: React.MouseEvent) => onMouseUp(e);
        document.addEventListener("mousemove", mouseMoveEvent, false);
        document.addEventListener("mouseup", mouseUpEvent, false);
    };

    const onMouseUp = (e: React.MouseEvent) => {
        setIsDragging(false);
        setWillClosed(false)
        document.removeEventListener("mousemove", mouseMoveEvent);
        document.removeEventListener("mouseup", mouseUpEvent);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            onResize(e);
        }
    };

    const onResize = (e: React.MouseEvent) => {
        const zeroPoint = window.innerWidth - Constants.default.inspector.width;
        const closedPoint = window.innerWidth - Constants.default.inspector.width +
            Constants.default.inspector.width *
            Constants.default.inspector.closingRatio;

        if (e.pageX > closedPoint) {
            //閉じる
            const width = Constants.default.inspector.closedWidth;
            setIsClosed(true);
            setWidth(width);
        }
        if (e.pageX > zeroPoint) {
            //閉じる
            setWillClosed(true);
        } else {
            //広げる
            const newWidth = window.innerWidth - e.pageX;
            if (newWidth >= Constants.default.inspector.width && newWidth <=
                Constants.default.inspector.maxWidth) {
                setWillClosed(false);
                setWidth(width);
            }
        }
    };

    const isDialog = () => {
        return (HttpUtil.getURLParam("dialog"));
    };

    const {children, inspector} = props;
    let childrendElement = children;
    if (isClosed) {
        childrendElement = null;
    }

    let _width = (inspector) ? inspector.width : width;
    let styleName = (isDialog()) ? style.property_dialog : style.property;

    return <div className={classnames(styleName, style.in,
        {
            [style.isClosed]: isClosed,
            [style.isDragging]: isDragging,
            [style.willClosed]: willClosed
        })}
                style={{width: _width}}>
        <InspectorKnob
            onMouseMove={(e) => onMouseMove(e)}
            onMouseDown={(e) => onMouseDown(e)}
            onMouseUp={(e) => onMouseUp(e)}
            isClosed={isClosed}
        />
        {childrendElement}
    </div>;

};


export {Resizer};
