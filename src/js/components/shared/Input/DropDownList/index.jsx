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
  hiddenNoSelect?: boolean;
  onClickAction?: Function;
  actionLabel?: string;
}

export default class DropDownList extends React.Component<Props> {

  /**
   * 変更イベント
   * @param e
   */
  onChange (e: Event) {
    const {onChange, label} = this.props
    const data = this.getDataFromList(e.target.value)
    onChange(e, data, label)
  }

  /**
   * 選択されたoptionを返す
   * @param value
   * @returns {*}
   */
  getDataFromList (value: string) {
    const {list} = this.props
    const found = list.find((data) => {
      return (data.value === value)
    })
    if (found === undefined) return {
      label: '選択してください',
      object: null,
      value: null,
    }
    return found
  }

  render () {
    let {label} = this.props
    const {list, defaultValue, disabled, hiddenNoSelect, onClickAction, actionLabel} = this.props
    let options = []
    let index = 0
    let action = null
    for (const data of list.values()) {
      options.push(<option key={index + 1} value={data.value}>{data.label}</option>)
      index++
    }

    let labelElement
    if (label) {
      labelElement = <span className={style.label}>{label}</span>
    }

    if (!hiddenNoSelect) {
      options.unshift(<option key={0} value={null}>選択してください</option>)
    }
    if (onClickAction) {
      action = <a href="#" onClick={(e) => onClickAction(e)} className={style.actionLabel}>{actionLabel}</a>
    }
    let select = <div className={classnames(style.dropdownListContainer, {[style.action]: (onClickAction)})}>
      {labelElement}
      <select disabled={disabled} defaultValue={defaultValue}
              onChange={(e) => this.onChange(e)}
              className={classnames(style.dropdownList, {[style.hasLabel]: (label)})}>{options}</select>
      {action}
    </div>
    return select
  }
}