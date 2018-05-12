import React from 'react'
import PropTypes from 'prop-types'
import Shadow from './Shadow'
import Constants from '../constants/index'

class Paper extends React.Component {
  render () {
    return <svg className="kskp-paper" style={{width:this.props.graph.width + Constants.paper.padding.right,height:this.props.graph.height + Constants.paper.padding.bottom}}>
      <Shadow />
      {this.props.children}
    </svg>
  }
}

Paper.propTypes = {}

export default Paper