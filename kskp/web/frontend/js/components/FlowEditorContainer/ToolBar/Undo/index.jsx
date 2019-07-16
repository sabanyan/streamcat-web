//@flow
import * as React from 'react'
import ToolBarButton from '../ToolBarButton'
import type { ToolBarButtonType } from '../../../../types'

const Undo = (props: ToolBarButtonType) => {
  const {onClick, children, disabled, icon} = props
  return <ToolBarButton onClick={onClick} disabled={disabled}
                        icon={icon}>{children}</ToolBarButton>
}

export default Undo
