// @flow
import {
  addStepAction,
  updateStepAction,
  updateFlowAction,
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
  loadFlowJSONAction,
  setZoomAction,
  updateDataFrameDetailAction
} from '../../modules/application'
import FlowEditor from './FlowEditor'
import { connect } from 'react-redux'
import * as React from 'react'
import { FlowModelProps } from '../../model/Flow/FlowModel'
import NavigationModel from '../../model/Navigation/NavigationModel'

let FlowEditorContainer

export type FlowEditorProps = {
  projectId: string,
  projectName: string,
  graph: { width: number, height: number,edges:any[],nodes:any[] };
  mast: { commands: any[] };
  loadFlowJSON: Function;
  addMaster: Function;
  selectSteps: Function;
  addSelectStep: Function;
  cutSteps: Function;
  copySteps: Function;
  pasteSteps: Function;
  deleteSteps: Function;
  updateStep: Function;
  updateFlow: Function;
  sortFlow: Function;
  executeFlow: Function;
  nodes: {};
  selected_step_ids: string[];
  selected_tab_id: string;
  children: React.Node;
  dragStart: Function;
  dragging: Function;
  dragEnd: Function;
  setZoom: Function;
  zoom: number;
  flow: FlowModelProps;
  navigation: NavigationModel;
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
      edges: state.edges,
      nodes: state.nodes,
      selected_step_ids: state.selected_step_ids,
      selected_tab_id: state.selected_tab_id,
      drag: state.drag,
      selected_in_edges: state.selected_in_edges,
      selected_out_edges: state.selected_out_edges,
      zoom: state.zoom,
      flow: state.flow,
      originalFlow: state.originalFlow,
      navigation: state.navigation
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
      updateFlow (...args) {
        dispatch(updateFlowAction(...args))
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
      sortFlow (...args) {
        dispatch(sortFlowAction(...args))
      },
      executeFlow (...args) {
        dispatch(executeFlowAction(...args))
      },
      selectTab (...args) {
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
      setZoom (...args) {
        dispatch(setZoomAction(...args))
      },
      updateDataFrameDetail(...args){
        dispatch(updateDataFrameDetailAction(...args))
      }
    }
  },
)(FlowEditor)