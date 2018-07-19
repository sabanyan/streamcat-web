//@flow
import * as React from 'react'
import style from './style.scss'

type Props = {
  onChange?: Function;
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
    const data = this.getDataFromList(e.target.value)
    onChange(e, data)
  }

  getDataFromList (value:string) {
    const {list} = this.props
    list.forEach((data) => {
      if (data.value === value) {
        return data
      }
    })
  }

  render () {
    const {list, defaultValue, disabled} = this.props

    console.log(list)

    let options = []
    let index = 0
    for(const data of list.values()){
      console.log(data)
      options.push(<option key={index + 1} value={data.value}>{data.label}</option>)
      index++
    }

    options.unshift(<option key={0}>選択してください</option>)
    let select = <select disabled={disabled} defaultValue={defaultValue}
                         onChange={(e) => this.onChange(e)}
                         className={style.dropdownlist}>{options}</select>
    return select
  }
}