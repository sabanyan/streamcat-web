// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  placeholder?: string;
  onChange?: Function;
  rules?: {}
}

type State = {
  validation: boolean;
  validation_messages: [];
}

export default class TextField extends React.Component<Props,State> {
  static defaultProps = {
    placeholder: "",
    onChange: {},
    rules: null,
  }

  constructor (props:Props) {
    super(props)
    this.state = {
      validation: true,
      validation_messages: [],
    }
  }

  hasRules (rules:?{}) {
    if (rules === {} || rules === null) {
      return false
    }
    return true
  }

  validateField (e:SyntheticInputEvent<EventTarget>, rules:?{}) {
    let validation_messages = []
    if (!this.hasRules(rules)) {
      return validation_messages
    }
    if(!rules)return null
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

  onChange (e:SyntheticInputEvent<EventTarget>) {
    const {onChange, rules} = this.props
    let validation_messages = this.validateField(e, rules)
    const validation = {
      validation: (!validation_messages.length),
      validation_messages: validation_messages,
    }
    if(onChange)onChange(e, validation)
    this.setState(validation)
  }

  renderValidationMessage () {
    const {validation_messages} = this.state
    const messages = validation_messages.map((message, index) => {
      return <li key={index} className={style.message}>{message}</li>
    })
    return <div>
      <ul className={style.validation_messages}>
        {messages}
      </ul>
    </div>

  }

  render () {
    const {placeholder} = this.props
    const {validation} = this.state

    const input_class = classnames('form-control', {
      [style.error]: !validation,
    })

    return <div>
      <input type="text" ref={'input'} className={input_class}
             placeholder={placeholder}
             onChange={(e) => this.onChange(e)}></input>
      {this.renderValidationMessage()}
    </div>
  }

}