//@flow
import * as React from 'react'

type Props = {
  submit: Function;
  rules: {};
  children: React.Node;
}

export default class ValidationForm extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  validate(){
    const {rules} = this.props


  }

  submit(){
    const {submit,rules} = this.props
    if(this.validate()){

    }
    if(this.submit){
      this.props.submit()
    }
  }

  render () {
    return <form onSubmit={this.submit}>
      {this.props.children}
    </form>
  }

}