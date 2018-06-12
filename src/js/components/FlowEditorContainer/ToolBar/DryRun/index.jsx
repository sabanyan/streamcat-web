import React from 'react'
import style from '../style.scss'
import ToolBarButton from '../ToolBarButton'

const DryRun = (props) => {
  const {onClick,children,disabled,icon} = props;
  return <ToolBarButton onClick={onClick} disabled={disabled} icon={icon}>{children}</ToolBarButton>
}

export default DryRun
