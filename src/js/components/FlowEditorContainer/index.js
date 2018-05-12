import { connect } from 'react-redux'
import { addStepAction, updateStepAction, selectStepsAction, deleteStepAction,addMasterAction,sortFlowAction, executeFlowAction  } from '../../actions/index'
import FlowEditor from './FlowEditor'

let FlowEditorContainer
export default FlowEditorContainer = connect(
  state => {
    return {
      graph: state.graph,
      mast: state.mast,
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
      },
      sortFlowAction(...args){
        dispatch(sortFlowAction(...args))
      },
      executeFlowAction(...args){
        dispatch(executeFlowAction(...args))
      }
    }
  }
)(FlowEditor)