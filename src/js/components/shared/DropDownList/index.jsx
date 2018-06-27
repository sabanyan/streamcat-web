//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'

type Props = {
  onChange: Function;
  list?: [
    {
      name: string,
      value: string,
      object: {}
    }];
}

export default class DropDownList extends React.Component<Props> {

  onChange (e) {
    const {onChange} = this.props
    const data = this.getDataFromList(e.target.value)
    onChange(e, data)
  }

  getDataFromList (value) {
    const {list} = this.props
    list.forEach((data) => {
      if (data.value === value) {
        return data
      }
    })
  }

  render () {
    const {list, defaultValue} = this.props
    let options = list.map((data, index) => {
      return <option key={index + 1} value={data.value}>{data.name}</option>
    })
    options.unshift(<option key={0}>選択してください</option>)
    let select = <select defaultValue={defaultValue}
                         onChange={(e) => this.onChange(e)}
                         className={style.dropdownlist}>{options}</select>
    return select
  }
}