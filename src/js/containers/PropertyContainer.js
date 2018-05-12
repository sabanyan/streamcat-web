import { connect } from 'react-redux'
import { addStepAction, updateStepAction, selectStepsAction, deleteStepAction } from '../actions'
import Property from '../components/Property'
let PropertyContainer
export default PropertyContainer = connect(
  state => {
    return {
      mast: state.mast,
      edges: state.edges,
      steps: state.steps,
      selected_step_ids: state.selected_step_ids,
    }
  },
  dispatch => {
    return {
      addStep(...args){
        dispatch(addStepAction(...args))
      },
      updateStep(...args){
        dispatch(updateStepAction(...args))
      },
      selectSteps (...args) {
        dispatch(selectStepsAction(...args))
      },
      deleteStep(...args){
        dispatch(deleteStepAction(...args))
      }
    }
  }
)(Property)
