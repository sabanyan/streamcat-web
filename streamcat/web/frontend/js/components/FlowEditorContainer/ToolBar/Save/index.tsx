//@flow
import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';

type Props = {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: React.ReactNode;
    disabled: boolean;
    flowIsUpdated: boolean;
};

export const Save = (props: Props) => {
    const {onClick, children, disabled, flowIsUpdated} = props;

    return <ToolBarButton onClick={onClick}
                          // flowが変更されていない場合は押下不可にする
                          disabled={!flowIsUpdated || disabled}
                          icon='&#xE2C2'
                          style={{width: 90 + 'px'}}>{children}</ToolBarButton>;
};
