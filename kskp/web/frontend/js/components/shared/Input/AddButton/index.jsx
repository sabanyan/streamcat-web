//@flow
import * as React from 'react'
import defaultStyle from './style.scss'
import classnames from 'classnames'

type Props = {
  onClick: Function;
  children: React.Children;
  className?: string;
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
    const {onClick, children, name, disabled} = this.props
    const style = (this.props.style) ? this.props.style : defaultStyle
    const iconClass = classnames('material-icons', [defaultStyle.icon])
    return <div className={classnames(style.addButton,{[style.disabled]:disabled})} onClick={(e)=>{(!disabled)?onClick(e):null}} name={name}>
      <i className={iconClass}>add_circle_outline</i>
      {children}
    </div>
  }
}
