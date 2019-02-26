//@flow
import React from 'react'
import ToolBarButton from '../ToolBarButton'
import style from './style.scss'
import type { ZoomToolBarButtonType } from '../../../../types'

const Zoom = (props:ZoomToolBarButtonType) => {
  const {onClickZoomIn,onClickZoomOut,onClickDefaultZoom,disabled,zoom} = props;
  return <div className={style.zoom}>
    <ToolBarButton onClick={onClickZoomIn} disabled={disabled} is_paper_toolbar_button={true}>+</ToolBarButton>
    <ToolBarButton onClick={onClickDefaultZoom} disabled={disabled} is_paper_toolbar_button={true}>{zoom}%</ToolBarButton>
    <ToolBarButton onClick={onClickZoomOut} disabled={disabled} is_paper_toolbar_button={true}>-</ToolBarButton>
  </div>
}

export default Zoom
