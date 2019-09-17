//@flow
import React from 'react'
import type { CommandParamType } from 'Types/index'
import { Param } from 'Shared/Inspector'
//import classnames from 'classnames'
import style from './style.scss'

type Props = {
  param: CommandParamType;
  events?: Function;
  defaultValue: any;
  refValue?: any;
}

export default class ParamBoolean extends Param {

  constructor (props: Props) {
    super(props)
  }

  onChange(e) {
    const props = this.props
    if (!props) {
      return
    }

    const {events, param} = props
    const {onBooleanArgsChange, onChange} = events
    if (onChange) {
      onChange(e)
    } else if (onBooleanArgsChange) {
      const value = e.currentTarget.checked
      onBooleanArgsChange(e, param,value)
    }
  }

  render () {
    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {param, onBuild, events, defaultValue, refValue} = this.props
    let inputRef = refValue
    if (onBuild) {
      inputRef = element => onBuild(param, element)
    }
    return <div className={style.param}>
      <label className={style.label}>
        <input name={param.name} className={style.checkbox} type="checkbox" ref={inputRef} checked={defaultValue}
               paramtype={param.type} onChange={(e) => this.onChange(e)} />
        {param.label}
      </label>
    </div>
  }

}