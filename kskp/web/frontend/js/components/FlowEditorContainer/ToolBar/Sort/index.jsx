//@flow
import React from 'react'
import { ToolBarButton } from 'FlowEditorContainer/ToolBar'
import type { ToolBarButtonType } from 'Types/index'

const Sort = (props: ToolBarButtonType) => {
  const {onClick, children, disabled, icon} = props
  return <ToolBarButton onClick={onClick} disabled={disabled} icon={icon}
                        is_paper_toolbar_button={true}>{children}</ToolBarButton>
}

export default Sort
