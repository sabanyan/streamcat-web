//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'

type Props = {
  onClick: Function;
  children: React.Children;
  className?: string;
}

export default class AddButton extends React.Component<Props> {
  static defaultProps = {
    onClick: () => {},
    disabled: false,
    icon: '',
    danger: false,
  }

  render () {
    const {onClick, children, className, name} = this.props
    const iconClass = classnames('material-icons', [style.icon])
    return <div className={style.addButton} onClick={onClick} name={name}>
      <i className={iconClass}>add_circle_outline</i>
      {children}
    </div>
  }
}