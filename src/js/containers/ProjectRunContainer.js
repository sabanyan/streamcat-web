import { connect } from 'react-redux'
import { sortFlowAction, executeFlowAction } from '../actions'
import ProjectRun from '../components/ProjectRun'
let ProjectRunContainer
export default ProjectRunContainer = connect(
  state => {
    return {
      flows: state.flows,
      edges: state.edges,
      steps: state.steps,
      selected_step_ids: state.selected_step_ids,
    }
  },
  dispatch => {
    return {
      sortFlowAction(...args){
        dispatch(sortFlowAction(...args))
      },
      executeFlowAction(...args){
        dispatch(executeFlowAction(...args))
      }
    }
  }
)(ProjectRun)
