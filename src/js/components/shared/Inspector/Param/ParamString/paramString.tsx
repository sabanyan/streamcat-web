import React from 'react'
import { CommandParamType } from 'Types/index'
import { Param } from 'Shared/Inspector'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  param: CommandParamType;
  
  label?: string;
  value?: string;
  inVailds?: string;
  isTextArea?: boolean;
  disabled?: boolean;
  
  onChange(e, param:CommandParamType):void;
}

type State = {
  input:JSX.Element
}

export default class ParamString extends React.Component<Props,State> {

  constructor(props:Props) {
    super(props)
  }

  renderTextarea(param:CommandParamType, classname:string, onChange:Function, value?:string, disabled?:boolean) {
    
    value = (value) ? value : ""
    
    return <textarea 
      name={param.name} 
      className={classname} 
      placeholder={param.name}
      onChange={(e) => onChange(e, param)}
      value={value}
      disabled={disabled}
    ></textarea>
  }

  renderInput(param:CommandParamType, classname:string, onChange:any, value?:string, disabled?:boolean) {
 
    value = (value) ? value : ""

    return <input 
        name={param.name} 
        type="text" 
        className={classname} 
        placeholder={param.name}
        onChange={onChange}
        disabled={disabled}
        value={value}
    ></input>
  }

  render () {
    const {param} = this.props
    const {label, value, inVailds, isTextArea, disabled} = this.props
    const {onChange} = this.props

    const labelContainer = (label) ? <label>{label}</label> : null
    const classname = (isTextArea) ? classnames('form-control', [style.textArea]) : classnames('form-control', [style.input])
  
    const input = (isTextArea) ? this.renderTextarea(param, classname, onChange, value, disabled) : this.renderInput(param, classname, onChange, value, disabled)
    
    // 親コンポエントでKeyが要る場合、親コンポエントでDivなどで囲んで、Key指定
    return <React.Fragment>
      {labelContainer}
      {input}
      <div>
        {inVailds}
      </div>
    </React.Fragment>
  }
}