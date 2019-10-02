//@flow
import React from 'react'
import { ParamUtil } from 'Utils/index'
import CommandModel from 'Model/Command/CommandModel'
import type { CommandParamType } from 'Types/index'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  params: [CommandParamType];//パラメーター定義
  headers?: [];//カラム情報
  args: {};//入力値
  groups?:[];
  command: CommandModel;
  invalids: {};
  onBuild: Function;
  events: {};
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
  getDefaultValueOrArgsValue (args: {}, param: CommandParamType) {
    let value = args[param.name]
    //入力値 or 初期値を取得する
    if (value === undefined) {
      if (param.default !== undefined) {
        value = param.default
      }
    }
    return value
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

  renderGroup(key, label) {
    return <div key={key} className={style.group}>
      {label}
    </div>
  }

  renderParam(param, key) {
    const {args, command, invalids, onBuild, events, headers} = this.props
    let isPresence = (command) ? this.isPresence(command, param) : false
    const value = this.getDefaultValueOrArgsValue(args, param)
    const paramElement = ParamUtil.getParamElement(param, onBuild, events, value, param.name, headers)
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
    let paramsForm = []
  
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