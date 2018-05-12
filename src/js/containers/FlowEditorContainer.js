import { connect } from 'react-redux'
import { addStepAction, updateStepAction, selectStepsAction, deleteStepAction,addMasterAction } from '../actions'
import FlowEditor from '../components/FlowEditor'

let FlowEditorContainer
export default FlowEditorContainer = connect(
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
      addMaster(...args){
        dispatch(addMasterAction(...args))
      },
      addStep (...args) {
        dispatch(addStepAction(...args))
      },
      updateStep (...args) {
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
)(FlowEditor)