import React from 'react'
import PropTypes from 'prop-types'

class PaperScroller extends React.Component {
  componentDidMount(){
  }

  onMouseDown(e){
    if(e._dispatchListeners.length == 1){
      this.props.selectSteps()
    }
  }

  render () {
    return <div onMouseDown={(e)=>this.onMouseDown(e)} className="kskp-paper-scroller">
      {this.props.children}
    </div>
  }
}

PaperScroller.propTypes = {}

export default PaperScroller