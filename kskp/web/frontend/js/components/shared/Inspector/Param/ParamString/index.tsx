import React from 'react'
import { CommandParamType } from 'Types/index'
import Constants from 'Constants/index'
import style from './style.scss'

type Props = {
  label?      :string;
  param       :CommandParamType;
  disabled?   :boolean;
  value?      :string;
  
  // event
  onChange?   :Function; // onChange(e, param)
}

export default class ParamString extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
  }

  onChange(e) {
    try {
        const {param, onChange} = this.props
        let value = e.currentTarget.value
        // ParamNumber 対応
        //if (param.type === Constants.param.type.number && value !== '') value = parseInt(value) 
        if (onChange) onChange(e, param, value)
    } catch(e) {
        console.log(e)
    }
  }

  //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
  render () {
    const {label,param, disabled, value} = this.props
    const {onChange} = this.props

    let isDisabled = (disabled) ? true : false
    let labelContainer = (label) ? <label>{label}</label> : null
    let currentValue = (value) ? value : ''

    return <div className={style.param}>
      {labelContainer}
      <input 
        name={param.name}
        type="text" 
        className="form-control" 
        data-paramtype={param.type}
        placeholder={param.name} 
        value={currentValue}
        disabled={isDisabled}
        onChange={(e) => this.onChange(e)}>  
      </input>
    </div>
  }

}