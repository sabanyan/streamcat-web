//@flow
import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';

type Props = {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: React.ReactNode;
    disabled: boolean;
};

export const Save = (props: Props) => {
    const {onClick, children, disabled} = props;

    return <ToolBarButton onClick={onClick}
                          disabled={disabled}
                          icon='&#xE2C2'
                          style={{width: 90 + 'px'}}>{children}</ToolBarButton>;
};
