//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'

type Props = {
  onClick: Function;
  children: React.Children;
  disabled: boolean;
  icon: string;
  danger: boolean;
  className?: string;
  primary?: boolean;
}

export default class Button extends React.Component<Props> {
  static defaultProps = {
    onClick: () => {},
    disabled: false,
    icon: '',
    danger: false,
  }

  render () {
    const {onClick, children, disabled, icon, danger,className, primary} = this.props
    const iconClass = classnames('material-icons', [style.icon])
    const buttonClass = classnames(style.button, {[style.danger]: danger,[className]:(className),[style.primary]:primary})
    const materialIcon = (icon)
      ? <i className={iconClass} dangerouslySetInnerHTML={{__html: icon}}></i>
      : null
    return <button type="button" className={buttonClass} disabled={disabled} onClick={onClick}>
      {materialIcon}
      <div className={classnames({[style.whiteText]:primary,[style.text]:!primary})}>
        {children}
      </div>
    </button>
  }
}