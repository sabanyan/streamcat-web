//@flow
import React from 'react'
import type { CommandParamType } from 'Types/index'
import { Param } from 'Shared/Inspector'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  param: CommandParamType;
  events?: {};
  defaultValue: any;
  refValue?: any;
}

export default class ParamString extends Param {
  constructor (props: Props) {
    super(props)
  }

  render () {
    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {param, onBuild, events, defaultValue, refValue, disabled, noLabel} = this.props
    let inputRef = refValue
    if (onBuild) {
      inputRef = element => onBuild(param, element)
    }
    const label = (param.label) ? param.label : param.name
    const labelContainer = (noLabel) ? null : <label>{label}</label> 
    const classname = classnames('form-control', [style.textArea])
    return <div>
      {labelContainer}
      <textarea name={param.name} type="text" className={classname} placeholder={param.name} defaultValue={defaultValue}
      ref={inputRef} disabled={disabled} paramtype={param.type}  {...events}></textarea>
      
      {/*
      <input name={param.name} type="text" className="form-control" placeholder={param.name} defaultValue={defaultValue}
             ref={inputRef} disabled={disabled} paramtype={param.type}  {...events} ></input>
             */
      }
    </div>
  }
}

