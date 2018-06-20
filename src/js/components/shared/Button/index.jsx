//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'

type Props={
  onClick:Function;
  children: React.Children;
  disabled: boolean;
  icon: string;
  danger: boolean;
}

export default class Button extends React.Component<Props> {
  static defaultProps= {
    onClick:()=>{},
    disabled: false,
    icon: "",
    danger: false
  }
  render () {
    const {onClick,children,disabled,icon,danger} = this.props;
    const icon_class = classnames("material-icons",[style.icon])
    const material_icon = (icon)?<i className={icon_class} dangerouslySetInnerHTML={{__html:icon}}></i>:null
    return <button type="button" className={classnames(style.button,{[style.danger]:danger})} disabled={disabled} onClick={onClick}>
      {material_icon}
      <div className={style.text}>
        {children}
      </div>
    </button>
  }
}