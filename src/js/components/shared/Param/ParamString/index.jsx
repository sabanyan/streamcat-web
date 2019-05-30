//@flow
import React from 'react'
import type { CommandParamType } from '../../../../types/index'
import Param from '../index'
//import classnames from 'classnames'

type Props = {
  param : CommandParamType;
  events?: {};
  defaultValue : any;
  refValue?: any;
}

export default class ParamString extends Param {
  constructor (props: Props) {
    super(props)
  }

  render () {
    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    const {param,onBuild,events,defaultValue,refValue,disabled} = this.props
    let inputRef = refValue
    if(onBuild){
      inputRef = element => onBuild(param,element)
    }

    const label = (param.label)?param.label:param.name
    return <div>
      <label>
        {label}
      </label>
      <input name={param.name} type="text" className="form-control" placeholder={param.name} defaultValue={defaultValue} ref={inputRef} disabled = {disabled} paramtype={param.type}  {...events} ></input>
    </div>
  }

}