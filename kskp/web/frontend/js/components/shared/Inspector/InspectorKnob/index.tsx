//@flow
import * as React from "react";
import style from "./style.scss";
import classnames from "classnames";

type Props = {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    isClosed: boolean;
}

const InspectorKnob = (props: Props) => {
    const {isClosed, onMouseMove, onMouseDown, onMouseUp} = props;
    return <div className={classnames(style.inspector_knob,
        {[style.isClosed]: isClosed})}
                onMouseMove={onMouseMove}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp} />;
};

export {InspectorKnob};
