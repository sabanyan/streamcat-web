import * as React from 'react'
import defaultStyle from './style.scss'
import classnames from 'classnames'

type Props = {
  name:string;
  style:any;

  onClick: Function;
  children: React.ReactChildren;
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
    const {onClick, children, name} = this.props
    const style = (this.props.style) ? this.props.style : defaultStyle
    const iconClass = classnames('material-icons', [defaultStyle.icon])
    return <div className={style.addButton} onClick={(e) => onClick(e)}>
      <i className={iconClass}>add_circle_outline</i>
      {children}
    </div>
  }
}