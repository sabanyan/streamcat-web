//@flow
import React from 'react'

export default class Param extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  getLabel () {
    return (this.props.param.label) ? this.props.param.label : this.props.param.name
  }
}