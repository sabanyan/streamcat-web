import React from 'react'
import { ParamString, ParamNumber, ParamBoolean, ParamSelect, ParamList, Param } from 'Shared/Inspector/index'
import CommandModel from 'Model/Command/CommandModel'
import { CommandParamType } from 'Types/index'
import Constants from 'Constants/index'
import classnames from 'classnames'
import style from './style.scss'
import { param } from 'jquery'


export type Element = {
  name: string;
  type: string;
  label: string;
  input_balluon?: {
    text?: ""
  };
  section?: boolean;
}

export type Param = {
  name: string;
  type: string;
  label: string;
  input_ballon: {
    text: string;
  };
  description: string;
  elements: Element[];
  default: {};
  helper: {};
  options: {
    labels?: string[];
    values?: string[];
    multiple: boolean;
  };
}

export type Group = {
  name: string;
  label: string;
  params: string[];
  hide_background: boolean;
}

type Props = {
  params: CommandParamType[];//パラメーター定義
  groups?: [];　//パラメータのグルプ定義
  args: {};//入力値
  invalids: {}; // Validationチェック内容
  command?: CommandModel;
  headers?: string[];//カラム情報
  disabled?: boolean;
  // event
  onChange: (e: React.ChangeEvent<HTMLInputElement>, param: CommandParamType, value: any) => void
}

type State = {
  helperTargetedInput: any;
}

export default class ParamsForm extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)

    this.state = {
      helperTargetedInput: null
    }
  }

  setHelperTargetedInput(inputEl) {

    this.setState({
      helperTargetedInput: inputEl
    })
  }

  /**
   * 初期値 or 入力値の取得
   * @param args
   * @param param
   * @returns {*}
   */
  getDefaultValueOrArgsValue(args: {} | [], param: CommandParamType) {
    return args[param.name]
  }

  /**
   * コマンドの場合の必須判定
   * @param command
   * @param param
   * @returns {boolean}
   */
  isPresence(command: CommandModel, param: CommandParamType) {
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
  getInvalidMessageElement(invalid: ([] | string)) {
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

  getParamElement(param: CommandParamType, disabled: boolean = false, label?: string, value?: any, onChange?: Function, headers?: string[]) {
    let paramElement: any
    let className = param.type === Constants.param.type.boolean ? classnames(style.param, style.flex) : style.param
    try {
      switch (param.type) {
        case Constants.param.type.number:
        case Constants.param.type.string:
          paramElement = <ParamString
            label={label} param={param} disabled={disabled} value={value} helperTargetedInput={this.state.helperTargetedInput}
            helper={param.helper}
            setHelperTargetedInput={this.setHelperTargetedInput.bind(this)} onChange={onChange} />
          break
        case Constants.param.type.boolean:
          paramElement = <ParamBoolean label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.select:
          paramElement = <ParamSelect label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.column:
          //カラム情報を付与
          param.options = {
            labels: headers,
            values: headers,
            multiple: (param.options && param.options.multiple) ? true : false
          }
          paramElement = <ParamSelect label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
          break
        case Constants.param.type.list:
          paramElement = <ParamList label={label} param={param} disabled={disabled} value={value}
            helperTargetedInput={this.state.helperTargetedInput} headers={headers}
            helper={param.helper}
            setHelperTargetedInput={this.setHelperTargetedInput.bind(this)} onChange={onChange} />
          break
      }
    } catch (e) {
      console.log(e)
    }

    return <React.Fragment>
      <div className={className}>
        <div className={style.labelContainer}>
          <div className={style.label}>{param.label}</div>
          <div className={style.description}>
            <div>{param.description}</div>
          </div>
        </div>
        {paramElement}
      </div>
    </React.Fragment>


  }

  renderGroup(group, key) {

    let className = group.hide_background ? style.group : classnames(style.group, style.colored)

    return <div className={"mb-12px"} key={key}>
      <div className={className}>
        {group.label}
      </div>
      <div className={style.description}>
        {group.description}
      </div>
    </div>
  }


  renderParam(param, key) {
    const { args, command, invalids, onChange, headers, disabled } = this.props
    let isPresence = (command) ? this.isPresence(command, param) : false
    const value = this.getDefaultValueOrArgsValue(args, param)
    const paramElement = this.getParamElement(param, disabled, param.label, value, onChange, headers)
    const invalidMessageEelement = this.getInvalidMessageElement(invalids[param.name])

    return <div key={key} className={classnames('mb-12px', {
      [style.presence]: isPresence,
      [style.invalid]: (invalidMessageEelement)
    })}>
      {paramElement}
      {invalidMessageEelement}
    </div>
  }

  renderParamsForm(params, groups) {
    let paramsForm: JSX.Element[] = []

    try {
      if (!params) throw "params is undefined in renderParamsForm"
      if (groups) {
        groups.forEach(group => {
          paramsForm.push(this.renderGroup(group, group.name + "_group"))
          group.params.forEach((paramName, index) => {
            const param = params.find(p => p.name == paramName)
            if (!param) throw "[Error] undefined params.name " + param.name + " in Group "
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

    } catch (e) {
      console.log(e)
    }

    return paramsForm
  }

  render() {
    const { params, groups } = this.props
    //パラメータフォームの作成

    return this.renderParamsForm(params, groups)
  }
}
