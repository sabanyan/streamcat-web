import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';

type Props = {
    undo: () => void;
    children: React.ReactNode;
    disabled: boolean;
};

export const Undo = (props: Props) => {
    const {undo, children, disabled} = props;
    return <ToolBarButton icon='undo'
                          onClick={() => undo()}
                          disabled={disabled}>{children}</ToolBarButton>;
};
