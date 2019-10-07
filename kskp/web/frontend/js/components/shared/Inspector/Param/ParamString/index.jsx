//@flow
import React from 'react'
import type { CommandParamType } from 'Types/index'
import { Param } from 'Shared/Inspector'
//import classnames from 'classnames'

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

  onChange(e) {
    const {param, events} = this.props

    if (events && events.onChange) {
      const onChange = events.onChange
      onChange(e, param)
    }
  }

  render () {
    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {param, onBuild, events, defaultValue, refValue, disabled} = this.props
    let inputRef = refValue
    if (onBuild) {
      inputRef = element => onBuild(param, element)
    }

    const label = (param.label) ? param.label : param.name
    return <div>
      <label>
        {label}
      </label>
      <input name={param.name} type="text" className="form-control" placeholder={param.name} defaultValue={defaultValue}
             ref={inputRef} disabled={disabled} paramtype={param.type} onChange={(e) => this.onChange(e)} ></input>
    </div>
  }

}