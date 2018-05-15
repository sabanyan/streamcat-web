// @flow
import * as React from 'react'

type Props = {
  children: React.Node;
  selectSteps: function;
}

class PaperScroller extends React.Component<Props> {
  componentDidMount(){
  }

  onMouseDown(e:{_dispatchListeners:{length:number}}){
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


export default PaperScroller