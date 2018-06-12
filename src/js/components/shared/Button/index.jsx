import React from 'react'
import style from './style.scss'
import classnames from 'classnames'

export default class Button extends React.Component {
  render () {
    const {onClick,children,disabled,icon,danger} = this.props;
    const icon_class = classnames("material-icons",[style.icon])
    return <button type="button" className={classnames(style.button,{[style.danger]:danger})} disabled={disabled} onClick={onClick}>
      <i className={icon_class} dangerouslySetInnerHTML={{__html:icon}}></i>
      <div className={style.text}>
        {children}
      </div>
    </button>
  }
}