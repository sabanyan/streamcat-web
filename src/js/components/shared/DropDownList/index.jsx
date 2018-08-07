//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'

type Props = {
  onChange?: Function;
  label?: string;
  list?: [
    {
      label: string,
      value: string,
      object: {}
    }];
  defaultValue: string;
  disabled: boolean;
}

export default class DropDownList extends React.Component<Props> {

  onChange (e:Event) {
    const {onChange} = this.props
    console.log(e.target.value)
    const data = this.getDataFromList(e.target.value)
    console.log(data)
    onChange(e, data)
  }

  getDataFromList (value:string) {
    const {list} = this.props
    list.forEach((data) => {
      console.log(value)
      console.log(data.value)
      if (data.value === value) {
        return data
      }
    })
  }

  render () {
    let {label} = this.props
    const {list, defaultValue, disabled} = this.props
    let options = []
    let index = 0
    for(const data of list.values()){
      options.push(<option key={index + 1} value={data.value}>{data.label}</option>)
      index++
    }

    let labelElement
    if(label){
      labelElement = <span className={style.label}>{label}</span>
    }

    options.unshift(<option key={0}>選択してください</option>)
    let select = <div className={style.dropdownListContainer}>{labelElement}<select disabled={disabled} defaultValue={defaultValue}
                         onChange={(e) => this.onChange(e)}
                         className={classnames(style.dropdownList,{[style.hasLabel]:(label)})}>{options}</select></div>
    return select
  }
}