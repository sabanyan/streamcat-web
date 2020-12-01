import React from 'react'
import { CommandParamType } from 'Types/index'
import style from './style.scss'

type Props = {
  label?      :string;
  param       :CommandParamType;
  disabled?   :boolean;
  value?      :boolean;
  // event
  onChange?   :Function; // onChange(e, param)
}

export default class ParamBoolean extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  onChange(e) {
    try {
        const {param, onChange} = this.props
        let value = e.currentTarget.checked
        if (onChange) onChange(e, param, value)
    } catch(e) {
        console.log(e)
    }
  }

  renderDescription() {
    let result = undefined
    try {
      const {param} = this.props
      if (param.description) {
        result = param.description
      }
    } catch(e) {
      console.log(e)
    }

    return <p className={style.description}>
      {result}
    </p>
  }  

  render () {
    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {label,param, disabled, value} = this.props
    const {onChange} = this.props

    const isDisabled = (disabled) ? true : false
    const isChecked = (value) ? true : false
    let labelContainer = (label) ? <React.Fragment>{label}{this.renderDescription()}</React.Fragment> : null
 
    return <React.Fragment>
      <input 
        name={param.name}
        className={style.checkbox}
        data-paramtype={param.type}
        type="checkbox"
        checked={isChecked}
        disabled={isDisabled}
        onChange={(e) => this.onChange(e)} />
    </React.Fragment>
  }
}