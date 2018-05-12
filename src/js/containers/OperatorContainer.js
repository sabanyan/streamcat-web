import { connect } from 'react-redux'
import {addStepAction,selectStepsAction} from '../actions'
import Operator from '../components/Operator'
let OperatorContainer
export default OperatorContainer = connect(
  state => {
    return {
      selected_step_ids: state.selected_step_ids,
    }
  },
  dispatch => {
    return {
      addStep(...args){
        dispatch(addStepAction(...args))
      },
      selectSteps (...args) {
        dispatch(selectStepsAction(...args))
      },
    }
  }
)(Operator)
