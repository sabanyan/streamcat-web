import React from 'react'
import style from '../style.scss'
import classnames from 'classnames'

const ToolBarButton = (props) => {
  const {onClick,children,disabled,icon} = props;
  const icon_class = classnames("material-icons",[style.icon],{[style.disabled]:disabled})
  const text_class = classnames([style.text],{[style.disabled]:disabled})
  return <button type="button" className={style.toolbar_btn} disabled={disabled} onClick={onClick}>
    <i className={icon_class} dangerouslySetInnerHTML={{__html:icon}}></i>
    <div className={text_class}>
      {children}
    </div>
  </button>
}

export default ToolBarButton
