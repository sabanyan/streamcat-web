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

export default class ParamBoolean extends Param {

  constructor (props: Props) {
    super(props)
  }

  render () {
    const {param,onBuild,defaultValue,refValue} = this.props
    let inputRef = refValue
    if(onBuild){
      inputRef = element => onBuild(param,element)
    }
    let required = null
    if(!param.optional){
      required = <span className={style.required}>*</span>
    }

    return <div className={style.param}>
      <label className={style.label}>
        <input className={style.checkbox} type="checkbox" defaultChecked={(defaultValue)} ref={inputRef} value={"true"}/>
        {param.label}{required}
      </label>
    </div>
  }

}