//@flow
import React from 'react'
import type { CommandParamType } from 'Types/index'
import { Param } from 'Shared/Inspector'
//import classnames from 'classnames'
import style from './style.scss'

type Props = {
  param: CommandParamType;
  onBuild?: Function;
  defaultValue: any;
  refValue?: any;
}

export default class ParamSelect extends Param {

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
    const {param, onBuild, events, defaultValue, refValue} = this.props
    let inputRef = refValue
    if (onBuild) {
      inputRef = element => onBuild(param, element)
    }

    const labels = param.options.labels
    const values = param.options.values
    const multiple = param.options.multiple

    const options = labels.map((label, index) => {return <option value={values[index]}>{label}</option>})

    // selectのmultiple属性がtrueの場合、valueはArrayになる必要がある。＃217
    let value = defaultValue
    if (multiple && defaultValue === undefined) {
      value = []
    }

    return <div className={style.param}>
      <label className={style.label}>
        {param.label}
      </label>
      <select name={param.name} defaultValue={value} ref={inputRef} className={'form-control'}
              multiple={multiple} paramtype={param.type} onChange={(e) => this.onChange(e)} >
        {options}
      </select>
    </div>
  }
}