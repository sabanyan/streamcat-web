//@flow
import React from 'react'
import ToolBarButton from 'FlowEditorContainer/ToolBar/ToolBarButton'
import type { ToolBarButtonType } from 'Types/index'

const Run = (props: ToolBarButtonType) => {
  const {onClick, children, disabled, icon} = props
  return <ToolBarButton onClick={onClick} disabled={disabled}
                        icon={icon}>{children}</ToolBarButton>
}

export default Run
