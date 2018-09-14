//@flow
import React from 'react'
import type { CommandParamType } from '../../../../types/index'
import Param from '../index'
//import classnames from 'classnames'
//import style from './style.scss'

type Props = {
  param : CommandParamType;
  onBuild?: Function;
  defaultValue : any;
  refValue?: any;
}

export default class ParamString extends Param {
  constructor (props: Props) {
    super(props)
  }

  render () {
    const {param,onBuild,defaultValue,refValue,disabled} = this.props
    let inputRef = refValue
    if(onBuild){
      inputRef = element => onBuild(param,element)
    }
    const label = (param.label)?param.label:param.name
    return <div>
      <label>
        {label}
      </label>
      <input type="text" className="form-control" placeholder={param.name} defaultValue={defaultValue} ref={inputRef} disabled = {disabled}></input>
    </div>
  }

}