// @flow
import {
  addStepAction,
  updateStepAction,
  selectStepsAction,
  deleteStepAction,
  addMasterAction,
  sortFlowAction,
  executeFlowAction
} from '../../modules/application';
import FlowEditor from './FlowEditor';
import { connect } from 'react-redux';

let FlowEditorContainer
export type FlowEditorProps = {
  graph: { width: number, height: number };
  mast: { operators: any[] };
  addMaster: Function;
  selectSteps: Function;
  deleteStep: Function;
  updateStep: Function;
  edges: any[];
  steps: {};
  selected_step_ids: string[];
  selected_tab_id: string;
  children: React.Node;
  dragStart: Function;
  dragging: Function;
  dragEnd: Function;
}
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
      addMaster (...args) {
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
      deleteStep (...args) {
        dispatch(deleteStepAction(...args))
      },
      sortFlowAction (...args) {
        dispatch(sortFlowAction(...args))
      },
      executeFlowAction (...args) {
        dispatch(executeFlowAction(...args))
      }
    }
  }
)(FlowEditor)