//@flow
import React from 'react'
import * as defaultStyle from './style.scss'
import classnames from 'classnames'

type Props = {
  onClick: Function;
  children?: string;
  style?: any;
  disabled?: boolean;
}

export default class AddButton extends React.Component<Props> {
  static defaultProps = {
    onClick: () => {},
    disabled: false,
    icon: '',
    danger: false,
  }

  render () {
    const {onClick, children, disabled} = this.props
    const style = (this.props.style) ? this.props.style : defaultStyle
    const iconClass = classnames('material-icons', [style.icon])
    return <div className={classnames(style.addButton,{[style.disabled]:disabled})} onClick={(e)=>{(!disabled)?onClick(e):null}}>
      <i className={iconClass}>add_circle_outline</i>
      {children}
    </div>
  }
}
