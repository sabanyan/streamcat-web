//@flow
import React from "react";
import {ToolBarButton} from "FlowEditorContainer/ToolBar";
import {ToolBarButtonType} from "Types/index";

const Save = (props: ToolBarButtonType) => {
    const {onClick, children, disabled, icon} = props;

    return <ToolBarButton onClick={onClick} disabled={disabled}
                          icon={icon} style={style}>{children}</ToolBarButton>;
};

export {Save};

export const style = {
    width: 90 + "px"
};
