import { connect } from 'react-redux'
import Paper from '../components/Paper'

let PaperContainer
export default PaperContainer = connect(
  state => {
    return {
      graph: state.graph,
    }
  }
)(Paper)