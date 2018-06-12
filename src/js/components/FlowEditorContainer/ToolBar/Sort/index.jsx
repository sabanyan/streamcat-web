import React from 'react'
import ToolBarButton from '../ToolBarButton'

const Sort = (props) => {
  const {onClick,children,disabled,icon} = props;
  return <ToolBarButton onClick={onClick} disabled={disabled} icon={icon}>{children}</ToolBarButton>
}

export default Sort
