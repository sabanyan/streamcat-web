import React from 'react'
import { CommandParamType } from 'Types/index'
import {Button} from 'Shared/Input/index'
import style from './style.scss'

type Props = {
  label?      :string;
  param       :CommandParamType;
  disabled?   :boolean;
  value?      :string | string[]; // default : []
  // event
  onChange?   :Function; // onChange(e, param)
}

export default class ParamSelect extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
  }

  getMultipleValue(e) {
    let options:any = e.target.options;
    let value:string[] = [];
    for (var i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    return value
  }

  getSingleValue(e) {
    return e.target.value
  }

  onChange(e, multiple:boolean) {
    try {
      e.preventDefault()
      const {param, onChange} = this.props
      let value:string | string[]
      if (multiple) {
        value = this.getMultipleValue(e)
      } else {
        value = this.getSingleValue(e)
      }
      if (onChange) onChange(e, param, value)
    } catch(e) {
        console.log(e)
    }
  }

  onClear(e, multiple:boolean) {
    try {
      const {param, onChange} = this.props
      let value 
      if (multiple) {
        value = []
      } else {
        value = undefined
      }
      if (onChange) onChange(e, param, value)
    } catch(e) {
      console.log(e)
    }
  }

  render () {
    const {label,param, disabled, value} = this.props
    const {onChange} = this.props
  
    const labels = param.options.labels
    const values = param.options.values
    const multiple = param.options.multiple
    const options = labels.map((label, index) => {return <option key={values[index]} value={values[index]}>{label}</option>})
    const isDisabled = (disabled) ? true : false
    const labelContainer = (label) ? <label>{label}</label> : null
    let selectedValue = value
    if (!multiple && selectedValue === undefined) {
      selectedValue = ""
      options.unshift(<option key={0} value={""}>{""}</option>)
    } 

    return <div className={style.param}>
      {labelContainer}
        <i className="fas fa-eraser" onClick={(e) => this.onClear(e, multiple)}></i>
      <select 
        name={param.name}
        className={'form-control'}
        data-paramtype={param.type}
        value={selectedValue}
        disabled={isDisabled} 
        multiple={multiple}
        onChange={(e) => this.onChange(e, multiple)}>
        {options}
      </select>
    </div>
  }
}