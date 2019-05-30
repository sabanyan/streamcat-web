//@flow
import React from 'react'
import ToolBarButton from '../ToolBarButton'
import type { ToolBarButtonType } from '../../../../types'

const Sort = (props: ToolBarButtonType) => {
  const {onClick, children, disabled, icon} = props
  return <ToolBarButton onClick={onClick} disabled={disabled} icon={icon}
                        is_paper_toolbar_button={true}>{children}</ToolBarButton>
}

export default Sort
