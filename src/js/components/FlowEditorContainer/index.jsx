// @flow
import {
  addStepAction,
  updateStepAction,
  selectStepsAction,
  addSelectStepAction,
  deleteSelectStepAction,
  cutStepsAction,
  copyStepsAction,
  pasteStepsAction,
  deleteStepsAction,
  addMasterAction,
  sortFlowAction,
  executeFlowAction,
  selectTabAction,
  dragStartAction,
  draggingAction,
  dragEndAction,
  loadFlowJSONAction
} from '../../modules/application'
import FlowEditor from './FlowEditor'
import { connect } from 'react-redux'
import * as React from 'react'

let FlowEditorContainer

export type FlowEditorProps = {
  projectId: string,
  projectName: string,
  graph: { width: number, height: number };
  mast: { operators: any[] };
  loadFlowJSON: Function;
  addMaster: Function;
  selectSteps: Function;
  addSelectStep: Function;
  cutSteps: Function;
  copySteps: Function;
  pasteSteps: Function;
  deleteSteps: Function;
  updateStep: Function;
  edges: any[];
  nodes: {};
  selected_step_ids: string[];
  selected_tab_id: string;
  children: React.Node;
  dragStart: Function;
  dragging: Function;
  dragEnd: Function;
  drag: {
    start: {
      x: number,
      y: number
    },
    end: {
      x: number,
      y: number
    }
  }
}

export default FlowEditorContainer = connect(
  state => {
    return {
      projectId: state.projectId,
      projectName: state.projectName,
      graph: state.graph,
      mast: state.mast,
      flows: state.flows,
      edges: state.edges,
      nodes: state.nodes,
      selected_step_ids: state.selected_step_ids,
      selected_tab_id: state.selected_tab_id,
      drag: state.drag,
      selected_in_edges: state.selected_in_edges,
      selected_out_edges: state.selected_out_edges,
    }
  },
  dispatch => {
    return {
      loadFlowJSON (...args) {
        dispatch(loadFlowJSONAction(...args))
      },
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
      addSelectStep (...args) {
        dispatch(addSelectStepAction(...args))
      },
      deleteSelectStep (...args) {
        dispatch(deleteSelectStepAction(...args))
      },
      deleteSteps (...args) {
        dispatch(deleteStepsAction(...args))
      },
      cutSteps (...args) {
        dispatch(cutStepsAction(...args))
      },
      copySteps (...args) {
        dispatch(copyStepsAction(...args))
      },
      pasteSteps (...args) {
        dispatch(pasteStepsAction(...args))
      },
      sortFlowAction (...args) {
        dispatch(sortFlowAction(...args))
      },
      executeFlowAction (...args) {
        dispatch(executeFlowAction(...args))
      },
      selectTabAction (...args) {
        dispatch(selectTabAction(...args))
      },
      dragStart (...args) {
        dispatch(dragStartAction(...args))
      },
      dragging (...args) {
        dispatch(draggingAction(...args))
      },
      dragEnd (...args) {
        dispatch(dragEndAction(...args))
      },
    }
  },
)(FlowEditor)