//@flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import Constants from '../../../constants'

type Props = {
  placeholder?: string;
  onChange?: Function;
  rules?: {};
  className?: string;
  defaultValue?: string;
  type?: string;
  formKey?: string;//指定されたフォーム要素のキー
  useForm?: boolean;//onChange時に指定された共通のFormイベントを叩くようにするため
}

type State = {
  validation: boolean;
  validation_messages: [];
}

export default class TextField extends React.Component<Props,State> {
  static defaultProps = {
    placeholder: "",
    onChange: null,
    rules: null,
    defaultValue:"",
    type: "text",
    useForm: false,
    formKey: ""
  }

  constructor (props:Props) {
    super(props)
    this.state = {
      validation: true,
      validation_messages: [],
    }

    const {useForm,formKey,defaultValue} = props

    if(useForm){
      window.emitter.emit(Constants.event.ON_CHANGE_FORM,
        {[formKey]: defaultValue})
    }
  }

  /**
   * バリデーションルールの有無
   * @param rules
   * @returns {boolean}
   */
  hasRules (rules:?{}) {
    if (rules === {} || rules === null) {
      return false
    }
    return true
  }

  /**
   * バリデーション
   * @param e
   * @param rules
   * @returns {*}
   */
  validateField (e:SyntheticInputEvent<EventTarget>, rules:?{}) {
    let validation_messages = []
    if (!this.hasRules(rules)) {
      return validation_messages
    }
    if(!rules)return null

    //ToDo: validate.jsの処理と共通化する

    Object.keys(rules).forEach((rule:string) => {
      const value = rules[rule]
      switch (rule) {
        case 'required':
          if (value === true) {
            if (e.target.value === '') {
              validation_messages.push('入力されていません')
            }
          }
          break
        case 'minlength':
          if (e.target.value.length < value) {
            validation_messages.push('最低' + value + '文字の入力が必要です')
          }
          break
        case 'maxlength':
          if (e.target.value.length < value) {
            validation_messages.push('最大' + value + '文字までです')
          }
          break
      }
    })
    return validation_messages
  }

  /**
   * onChangeイベント,onChangeFormもここで処理
   * @param e
   */
  onChange (e:SyntheticInputEvent<EventTarget>) {
    const {onChange,useForm,rules,formKey} = this.props
    if(!onChange && !useForm)return
    let validation_messages = this.validateField(e, rules)
    const validation = {
      validation: (!validation_messages.length),
      validation_messages: validation_messages,
    }
    if(onChange)onChange(e, validation)
    if(useForm){
      window.emitter.emit(Constants.event.ON_CHANGE_FORM,
        {[formKey]: e.target.value})
    }
    this.setState(validation)
  }

  /**
   * バリデーションメッセージ
   * @returns {*}
   */
  renderValidationMessage () {
    const {validation_messages} = this.state
    if(!validation_messages.length) return null
    const messages = validation_messages.map((message, index) => {
      return <li key={index} className={style.message}>{message}</li>
    })
    const messageClass = classnames({[style.validation_messages]:(messages.length)})
    return <div>
      <ul className={messageClass}>
        {messages}
      </ul>
    </div>
  }

  /**
   *
   * @returns {*}
   */
  render () {
    const {placeholder,defaultValue,type} = this.props
    const {validation} = this.state
    const input_class = classnames('form-control', {
      [style.error]: !validation,
      [this.props.className]:(this.props.className)
    })

    return <div>
      <input type={type} ref={'input'} className={input_class}
             placeholder={placeholder}
             onChange={(e) => this.onChange(e)}
      defaultValue={defaultValue}></input>
      {this.renderValidationMessage()}
    </div>
  }

}