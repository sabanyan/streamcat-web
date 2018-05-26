// @flow
import {
  addStepAction,
  updateStepAction,
  selectStepsAction,
  deleteStepAction,
  addMasterAction,
  sortFlowAction,
  executeFlowAction,
  dragStartAction,
  draggingAction,
  dragEndAction
} from '../../modules/application';
import FlowEditor from './FlowEditor';
import { connect } from 'react-redux';
import * as React from 'react'

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
  drag?: {
    start?:{
      x:number,
      y:number
    },
    end?:{
      x:number,
      y:number
    }
  }
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
      drag: state.drag
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
      },
      dragStart(...args){
        dispatch(dragStartAction(...args))
      },
      dragging(...args){
        dispatch(draggingAction(...args))
      },
      dragEnd(...args){
        dispatch(dragEndAction(...args))
      }
    }
  }
)(FlowEditor)