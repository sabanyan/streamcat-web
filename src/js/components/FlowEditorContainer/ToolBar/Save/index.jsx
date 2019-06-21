//@flow
import React from 'react'
import ToolBarButton from 'FlowEditorContainer/ToolBar/ToolBarButton'
import type { ToolBarButtonType } from 'Types/index'

const Save = (props: ToolBarButtonType) => {
  const {onClick, children, disabled, icon} = props
  return <ToolBarButton onClick={onClick} disabled={disabled}
                        icon={icon} style={style}>{children}</ToolBarButton>
}

export default Save

export const style = {
  width: 90 + 'px'
}
