//@flow
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
  addHistoryAction,
  undoAction,
  redoAction,
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
  updateDataFrameDetailAction,
  addNoteAction,
  updateCacheAction
} from '../../modules/application'
import FlowEditor from './FlowEditor'
import { connect } from 'react-redux'
import * as React from 'react'
import { FlowModelProps } from '../../model/Flow/FlowModel'
import NavigationModel from '../../model/Navigation/NavigationModel'
import type { DragType } from '../../types'
import { DataFrameDetailType } from '../../types'
import { addNotification,updateNotification,removeNotification} from 'reapop';

let FlowEditorContainer

export type FlowEditorProps = {
  projectId: string,
  projectName: string,
  graph: { width: number, height: number,edges:any[],nodes:any[] };
  mast: { commands: any[],subflows: any[],visualizers: any[] };
  loadFlowJSON: Function;
  addMaster: Function;
  selectSteps: Function;
  addSelectStep: Function;
  cutSteps: Function;
  copySteps: Function;
  pasteSteps: Function;
  addHistory: Function;
  undo: Function;
  redo: Function;
  deleteSteps: Function;
  updateStep: Function;
  updateFlow: Function;
  sortFlow: Function;
  executeFlow: Function;
  updateDataFrameDetail: Function;
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
  drag: DragType;
  notify: Function;
  updateNotify: Function;
  dismissNotify: Function;
  addNote: Function;
  updateCacheAction: Function;
}

export default FlowEditorContainer = connect(
  state => {
    return {
      projectId: state.reducer.projectId,
      projectName: state.reducer.projectName,
      graph: state.reducer.graph,
      mast: state.reducer.mast,
      edges: state.reducer.edges,
      nodes: state.reducer.nodes,
      history: state.reducer.history,
      selected_step_ids: state.reducer.selected_step_ids,
      selected_tab_id: state.reducer.selected_tab_id,
      selected_data_source_detail: state.reducer.selected_data_source_detail,
      drag: state.reducer.drag,
      selected_in_edges: state.reducer.selected_in_edges,
      selected_out_edges: state.reducer.selected_out_edges,
      zoom: state.reducer.zoom,
      flow: state.reducer.flow,
      originalFlow: state.reducer.originalFlow,
      navigation: state.reducer.navigation,
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
      addHistory (...args) {
        dispatch(addHistoryAction(...args))
      },
      undo (...args) {
        dispatch(undoAction(...args))
      },
      redo (...args) {
        dispatch(redoAction(...args))
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
      },
      notify(...args){
        return dispatch(addNotification(...args))
      },
      updateNotify(...args){
        return dispatch(updateNotification(...args))
      },
      dismissNotify(...args){
        setTimeout(()=>{
          dispatch(removeNotification(...args))
        },1000)
      },
      addNote(...args){
        dispatch(addNoteAction(...args))
      },
      updateCacheAction(...args){
        dispatch(updateCacheAction(...args))
      }
    }
  },
)(FlowEditor)