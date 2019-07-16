//@flow
import React from 'react'
import { ParamUtil } from 'Utils/index'
import CommandModel from 'Model/Command/CommandModel'
import type { CommandParamType } from 'Types/index'
import { AddButton, Button } from 'Shared/Input'
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

  onClickAddParamRow(e, param, v) {
    const { events } = this.props
 
    if (v && Array.isArray(v) && events && events.onUpdate) {
      events.onUpdate((step) => {
        if (step.args) {
          v.push("")
          step.args[param.name] = v
        }
        return step
      })
    }
  }

  onChangeParamRow(e, param, index) {
    const { events } = this.props
    if (param && param.multipleRow && events && events.onUpdate) {
      events.onUpdate((step) => {
        if (step.args) {
          step.args[param.name][index] = e.currentTarget.value
        }
        return step
      })
    }
  }

  onClickDeleteParamRow(param, v, index) {
    const { events } = this.props
    if (events && events.onUpdate) {
      events.onUpdate((step) => {
        if (step.args) {
          step.args[param.name] = step.args[param.name].filter((value, filterIndex) => {
            return (filterIndex !== index)
          })
          step.invalidMessage = [""]
        }
        return step
      })
    }
  }
  
  render () {
    const {params, args, invalids, command, onBuild, events, headers} = this.props
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
      let paramElement
      //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
      let paramElements = []
      let addButton = null
      if (param.multipleRow) {
        if (!value) {
          value = [""]
        }
        if (!(Array.isArray(value))) {
          value = [value]
        }
        value.forEach((v, index) => {
          let newEvent = {
            onChange : (e) => this.onChangeParamRow(e, param, index)
          }
          let noLabel = (index == 0) ? false : true
          paramElement = <div key={"param" + index}>
            <div  className={style.left}>
              {ParamUtil.getParamElement(param, onBuild, newEvent, v, param.name, headers, noLabel)}
            </div>
            <div className={(index === 0) ? style.topRight : style.right}>
              <Button danger={true} onClick={() => this.onClickDeleteParamRow(param, v, index)}>削除</Button>
            </div>
          </div>
        
          paramElements.push(paramElement)
        })
        addButton = <div className={style.addButton}>
          <AddButton onClick={(e) => this.onClickAddParamRow(e, param, value)}></AddButton>
        </div>
      } else {
        paramElement = ParamUtil.getParamElement(param, onBuild, events, value, param.name, headers) 
        paramElements.push(paramElement)
      }
      //入力エラーメッセージ
      const invalidMessageEelement = this.getInvalidMessageElement(invalids[param.name])

      return <React.Fragment>
        <div key={index} className={classnames('mb-8px', {
          [style.presence]: isPresence,
          [style.invalid]: (invalidMessageEelement)
        })}>
          {paramElements}
          {invalidMessageEelement}
          {addButton}
        </div>
      </React.Fragment>
    })

    return paramsForm
  }
}