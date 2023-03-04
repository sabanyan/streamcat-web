import React from 'react';
import {ToolBarButton} from 'FlowEditorContainer/ToolBar';

type Props = {
    addHistory: Function;
    sortFlow: Function;
    children: React.ReactNode;
    disabled: boolean;
};

export const Sort = (props: Props) => {
    const {addHistory, sortFlow, children, disabled} = props;

    return <ToolBarButton icon='&#xE42A'
                          is_paper_toolbar_button={true}
                          onClick={() => {
                              sortFlow();
                              addHistory();
                          }}
                          disabled={disabled}>{children}</ToolBarButton>;
};
