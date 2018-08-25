//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import Button from '../Button'
import TextField from '../TextField'

type Props = {
  placeholder?: string;
  onChange?: Function;
  onClick?: Function;
  children?: React.Children;
  disabled?: boolean;
  icon?: string;
  danger?: boolean;
}

export default class TextFieldWithButton extends React.Component<Props> {
  static defaultProps = {
    placeHolder: "",
    onChange:{},
    onClick:{},
    children: null,
    disabled: false,
    icon: "",
    danger: false
  }

  constructor (props:Props) {
    super(props)
  }

  render () {
    const {placeholder, onChange, onClick, children, disabled, icon, danger} = this.props
    return <div className={style.container}>
      <div className={style.textfield}><TextField placeholder={placeholder}
                                                  onChange={onChange}></TextField>
      </div>
      <div className={style.button}><Button onClick={onClick}
                                            disabled={disabled} icon={icon}
                                            danger={danger}>{children}</Button>
      </div>
    </div>
  }

}