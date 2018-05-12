import React from 'react'
import Icon from './Icon'

class Sort extends React.Component {
  render () {
    return (
      <Icon {...this.props}>
        <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
        <path d="M0 0h24v24H0z" fill="none" />
      </Icon>
    )
  }
}

export default Sort