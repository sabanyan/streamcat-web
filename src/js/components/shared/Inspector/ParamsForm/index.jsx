//@flow
import React from 'react'
import { ParamUtil } from 'Utils/index'
import CommandModel from 'Model/Command/CommandModel'
import type { CommandParamType } from 'Types/index'
import { AddButton, Button } from 'Shared/Input'
import classnames from 'classnames'
import style from './style.scss'
import Constants from 'Constants/index'
import { ParamBoolean, ParamNumber, ParamSelect, ParamString, ParamList } from 'Shared/Inspector'

type Props = {
  params: [CommandParamType];//パラメーター定義
  headers?: [];//カラム情報
  args: {};//入力値
  command: CommandModel;
  invalids: {};
  onBuild: Function;
  onChange: Function;
  onUpdate: Function;
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

  onArgChange(e, param, argIndex?, elementIndex?) {
    
  }

  // fixit：今後、Utilに書き換え検討
  getParamElement(param, value) {
    const {onUpdate} = this.props
    let paramElement

    switch(param.type) {
      case Constants.param.type.list:
        paramElement = <ParamList 
                        param={param}
                        arg={value}
                        onUpdate={onUpdate}></ParamList>
        break
    }

    return paramElement
  }

  render () {
    const {params, args, invalids, command, onBuild, onChange, onUpdate, headers} = this.props
    let isPresence = false

    //パラメータフォームの作成
    const paramsForm = params.map((param, index) => {

      //入力値 or 初期値を取得する
      let value = this.getDefaultValueOrArgsValue(args, param)

      //必須
      if (command) {
        isPresence = this.isPresence(command, param)
      }
      //型に種別に応じたDOMElementの取得
      let addButton = null
      let paramElement
      // fixit: 8~9月、要Refactor
      if (param.type == Constants.param.type.list) {
        paramElement = this.getParamElement(param,value)
      } else {
        paramElement = ParamUtil.getParamElement(param, onBuild, onChange, value, param.name, headers)
      }
     
      //入力エラーメッセージ
      const invalidMessageEelement = this.getInvalidMessageElement(invalids[param.name])

      return <div key={param.name + index} className={classnames('mb-8px', {
          [style.presence]: isPresence,
          [style.invalid]: (invalidMessageEelement)
        })}>
          {paramElement}
          {invalidMessageEelement}
          {addButton}
        </div>
    })

    return paramsForm
  }
}