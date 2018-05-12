import { connect } from 'react-redux'
import { selectStepsAction } from '../actions'
import PaperScroller from '../components/PaperScroller'

let PaperScrollerContainer
export default PaperScrollerContainer = connect(
  state => {
    return {
      graph: state.graph,
    }
  },
  dispatch => {
    return {
      selectSteps (...args) {
        dispatch(selectStepsAction(...args))
      },
    }
  }
)(PaperScroller)