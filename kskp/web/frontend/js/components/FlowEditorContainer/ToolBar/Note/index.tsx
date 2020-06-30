import * as React from "react";
import {ToolBarButton} from "FlowEditorContainer/ToolBar";
import {ToolBarButtonType} from "Types/index";

const Note = (props: ToolBarButtonType) => {
    const {onClick, children, disabled, icon} = props;
    return <ToolBarButton onClick={onClick} disabled={disabled}
                          icon={icon}>{children}</ToolBarButton>;
};

export {Note};
