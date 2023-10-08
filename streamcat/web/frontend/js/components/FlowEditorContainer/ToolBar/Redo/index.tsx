import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';

type Props = {
    redo: () => void;
    children: React.ReactNode;
    disabled: boolean;
};

export const Redo = (props: Props) => {
    const {redo, children, disabled} = props;
    return <ToolBarButton icon='redo'
                          onClick={() => redo()}
                          disabled={disabled}>{children}</ToolBarButton>;
};
