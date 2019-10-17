import React from 'react'
import {ParamString, ParamBoolean, ParamSelect, ParamList } from 'Shared/Inspector/index'
import CommandModel from 'Model/Command/CommandModel'
import { CommandParamType } from 'Types/index'
import Constants from 'Constants/index'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  params: CommandParamType[];//パラメーター定義
  groups?:[];　//パラメータのグルプ定義
  args: {};//入力値
  invalids: {}; // Validationチェック内容
  command?: CommandModel;
  headers?: string[];//カラム情報
  // event
  onChange: Function; // onChange(e:event, param:CommandParamType, value:any)
}

export default class ParamsForm extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  /**
   * 初期値 or 入力値の取得
   * @param args
   * @param param
   * @returns {*}
   */
  getDefaultValueOrArgsValue (args: {} | [], param: CommandParamType) {
    return args[param.name]
  }

  /**
   * コマンドの場合の必須判定
   * @param command
   * @param param
   * @returns {boolean}
   */
  isPresence (command: CommandModel, param: CommandParamType) {
    let isPresence = false
    if (command) {
      if (command.rules &&
        command.rules[param.name] &&
        command.rules[param.name]['presence']) {
        isPresence = true
      }
    }
    return isPresence
  }

  /**
   * 入力エラーメッセージの取得
   * @param invalid
   * @returns {*}
   */
  getInvalidMessageElement (invalid: ([] | string)) {
    const invalidMessage: ([] | string) = invalid
    if (invalidMessage) {
      if (Array.isArray(invalidMessage)) {
        const arrayMessage = invalidMessage.map(message => {
          return <div className={style.invalid_message}>
            {message}
          </div>
        })
        return <div>{arrayMessage}</div>
      }
      return <div className={style.invalid_message}>
        {invalidMessage}
      </div>
    }
    return null
  }

  getParamElement(param:CommandParamType, disabled:boolean=false,label?:string,value?:any, onChange?:Function, headers?:string[]) {
    let paramElement:any
    try {
      switch (param.type) {
        case Constants.param.type.number  :
        case Constants.param.type.string  :
          paramElement = <ParamString label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.boolean :
          paramElement = <ParamBoolean label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.select  :
          paramElement = <ParamSelect label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.column  :
          //カラム情報を付与
          param.options = {
            labels: headers,
            values: headers,
            multiple: (param.options && param.options.multiple) ? true : false
          }
          paramElement = <ParamSelect label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.list    :
          paramElement = <ParamList label={label} param={param} disabled={disabled} value={value} onChange={onChange} headers={headers} />
          break
      }
    } catch(e) {
      console.log(e)
    }

    return paramElement
  }

  renderGroup(key, label) {
    return <div key={key} className={style.group}>
      {label}
    </div>
  }

  renderParam(param, key) {
    const {args, command, invalids, onChange, headers} = this.props
    let isPresence = (command) ? this.isPresence(command, param) : false
    const value = this.getDefaultValueOrArgsValue(args, param)
    const paramElement = this.getParamElement(param, false, param.label, value, onChange, headers)
    const invalidMessageEelement = this.getInvalidMessageElement(invalids[param.name])

    return <div key={key} className={classnames('mb-8px', {
      [style.presence]: isPresence,
      [style.invalid]: (invalidMessageEelement)
    })}>
      {paramElement}
      {invalidMessageEelement}
    </div>
  }

  renderParamsForm(params, groups) {
    let paramsForm:JSX.Element[] = []
  
    try {      
      if(!params) throw "params is undefined in renderParamsForm"
      if (groups) {
        groups.forEach(group => {
          paramsForm.push(this.renderGroup(group.name + "_start", group.label))
          group.params.forEach((paramName, index) => {
            const param = params.find(p => p.name == paramName)
            if (!param) throw "[Error] undefined params.name in Group"
            const paramForm = this.renderParam(param, group.name + index)
            paramsForm.push(paramForm)
            params = params.filter(p => p.name !== paramName)
          })
        })
      }
      if (params) {
        params.forEach((param, index) => {
          console.log(param)
          const paramForm = this.renderParam(param, index)
          paramsForm.push(paramForm)
        })
      }

    } catch(e) {
      console.log(e)
    }

    return paramsForm
  }

  render () {
    const {params, groups} = this.props
    //パラメータフォームの作成

    const paramsForm = this.renderParamsForm(params, groups)

    return paramsForm
  }
}