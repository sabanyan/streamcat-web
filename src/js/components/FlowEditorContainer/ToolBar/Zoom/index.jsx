import React from 'react'
import ToolBarButton from '../ToolBarButton'
import style from './style.scss'

const Zoom = (props) => {
  const {onClick,children,disabled,icon} = props;
  return <div className={style.zoom}>
    <ToolBarButton onClick={onClick} disabled={disabled} is_paper_toolbar_button={true}>+</ToolBarButton>
    <ToolBarButton onClick={onClick} disabled={disabled} is_paper_toolbar_button={true}>100%</ToolBarButton>
    <ToolBarButton onClick={onClick} disabled={disabled} is_paper_toolbar_button={true}>-</ToolBarButton>
  </div>
}

export default Zoom
