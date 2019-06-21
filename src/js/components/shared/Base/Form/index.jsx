//@flow
import React from 'react'
import Constants from 'Constants/index'
//import classnames from 'classnames'
//import style from './style.scss'

type Props = {
  onSubmit: Function;
}

type State = {}

export default class Form extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
    //フォームの変更イベント（子のコンポーネントから実行される）
    window.emitter.removeListener(Constants.event.ON_CHANGE_FORM)
    window.emitter.addListener(Constants.event.ON_CHANGE_FORM,
      (context) => {
        Object.keys(context).map((key) => {
          const data = context[key]
          //TODO 将来的には . でつなげたキーをオブジェクトの子に設定できるようにする
          if (key.indexOf('.') !== -1) {
            this.setState({...this.state, ...context})
          } else {
            this.setState({...this.state, ...context})
          }
        })
      })
    window.emitter.removeListener(Constants.event.ON_SUBMIT_FORM)
    window.emitter.addListener(Constants.event.ON_SUBMIT_FORM,
      (context) => {
        this.props.onSubmit(this.state)
      })
  }

  render () {
    return <div>
      {this.props.children}
    </div>
  }

}