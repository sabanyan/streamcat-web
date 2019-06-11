//@flow
import React from 'react'
import type { CommandParamType } from '../../../../types/index'
import Param from '../index'
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
               paramtype={param.type}  {...events} />
        {param.label}
      </label>
    </div>
  }

}