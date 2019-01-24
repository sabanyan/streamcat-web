//@flow
import React from 'react'
import type { CommandParamType } from '../../../../types/index'
import Param from '../index'
//import classnames from 'classnames'
import style from './style.scss'

type Props = {
  param : CommandParamType;
  onBuild?: Function;
  defaultValue : any;
  refValue?: any;
}

export default class ParamSelect extends Param {

  constructor (props: Props) {
    super(props)
  }

  render () {
    const {param,onBuild,defaultValue,refValue} = this.props
    let inputRef = refValue
    if(onBuild){
      inputRef = element => onBuild(param,element)
    }

    const labels = param.options.labels
    const values = param.options.values

    const options = labels.map((label,index)=>{return <option value={values[index]}>{label}</option>})

    return <div className={style.param}>
      <label className={style.label}>
        {param.label}
      </label>
      <select name={param.name} defaultValue={defaultValue} ref={inputRef} className={"form-control"}>
        {options}
      </select>
    </div>
  }

}