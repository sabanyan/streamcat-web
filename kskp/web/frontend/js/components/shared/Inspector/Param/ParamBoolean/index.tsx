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

  render () {
    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {label,param, disabled, value} = this.props
    const {onChange} = this.props

    const isDisabled = (disabled) ? true : false
    const isChecked = (value) ? true : false

    return <div className={style.param}>
      <label className={style.label}>
        <input 
          name={param.name}
          className={style.checkbox}
          data-paramtype={param.type}
          type="checkbox"
          checked={isChecked}
          disabled={isDisabled}
          onChange={(e) => this.onChange(e)} />
        {label}
      </label>
    </div>
  }
}