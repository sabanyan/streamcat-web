//@flow
import React from 'react'
import type { CommandParamType } from '../../../../types/index'
//import classnames from 'classnames'
//import style from './style.scss'

type Props = {
  param : CommandParamType;
  onBuild?: Function;
  defaultValue : any;
  refValue?: any;
}

export default class ParamString extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  render () {
    const {param,onBuild,defaultValue,refValue} = this.props
    let inputRef = refValue
    if(onBuild){
      inputRef = element => onBuild(param,element)
    }

    return <div>
      <label>
        {param.label}
      </label>
      <input type="text" className="form-control" placeholder={param.name} defaultValue={defaultValue} ref={inputRef}></input>
    </div>
  }

}