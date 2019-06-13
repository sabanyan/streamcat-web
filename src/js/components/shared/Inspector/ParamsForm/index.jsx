//@flow
import React from 'react'
import ParamUtil from 'Utils/ParamUtil'
import CommandModel from 'Model/Command/CommandModel'
import type { CommandParamType } from 'Types/index'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  params: [CommandParamType];//パラメーター定義
  headers?: [];//カラム情報
  args: {};//入力値
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

  render () {
    const {params, args, invalids, command, onBuild, events, headers} = this.props
    let isPresence = false

    //パラメータフォームの作成
    const paramsForm = params.map((param, index) => {

      //入力値 or 初期値を取得する
      const value = this.getDefaultValueOrArgsValue(args, param)

      //必須
      if (command) {
        isPresence = this.isPresence(command, param)
      }

      //型に種別に応じたDOMElementの取得
      let paramElement
      //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも

      paramElement = ParamUtil.getParamElement(param, onBuild, events, value, param.name, headers)
      //入力エラーメッセージ
      const invalidMessageEelement = this.getInvalidMessageElement(invalids[param.name])

      return <div key={index} className={classnames('mb-8px', {
        [style.presence]: isPresence,
        [style.invalid]: (invalidMessageEelement)
      })}>
        {paramElement}
        {invalidMessageEelement}
      </div>
    })

    return paramsForm
  }
}