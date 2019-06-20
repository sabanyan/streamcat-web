//@flow
import {
  addHistoryAction,
  addMasterAction,
  addNoteAction,
  addSelectStepAction,
  addStepAction,
  copyStepsAction,
  cutStepsAction,
  deleteCacheAction,
  deleteSelectStepAction,
  deleteStepsAction,
  dragEndAction,
  draggingAction,
  dragStartAction,
  executeFlowAction,
  loadFlowJSONAction,
  pasteStepsAction,
  redoAction,
  selectStepsAction,
  selectTabAction,
  setZoomAction,
  sortFlowAction,
  sortStepSrcEndAction,
  undoAction,
  updateDataFrameDetailAction,
  updateFlowAction,
  updateStepAction,
} from 'Modules/application'
import FlowEditor from 'FlowEditorContainer/FlowEditor'
import { connect } from 'react-redux'
import * as React from 'react'
import type { FlowModelProps } from 'Model/Flow/FlowModel'
import NavigationModel from 'Model/Navigation/NavigationModel'
import type { DragType } from 'Types/index'
import { addNotification, removeNotification, updateNotification } from 'reapop'

let FlowEditorContainer

export type FlowEditorProps = {
  projectId: string,
  projectName: string,
  graph: { width: number, height: number, edges: any[], nodes: any[] };
  mast: { commands: any[], subflows: any[], visualizers: any[] };
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
  deleteCache: Function;
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
  sortStepSrcEndAction: Function;
}

export default FlowEditorContainer = connect(
  state => {
    return {
      projectId: state.flowEditorReducer.projectId,
      projectName: state.flowEditorReducer.projectName,
      graph: state.flowEditorReducer.graph,
      mast: state.flowEditorReducer.mast,
      edges: state.flowEditorReducer.edges,
      nodes: state.flowEditorReducer.nodes,
      history: state.flowEditorReducer.history,
      selected_step_ids: state.flowEditorReducer.selected_step_ids,
      selected_tab_id: state.flowEditorReducer.selected_tab_id,
      selected_data_source_detail: state.flowEditorReducer.selected_data_source_detail,
      drag: state.flowEditorReducer.drag,
      selected_in_edges: state.flowEditorReducer.selected_in_edges,
      selected_out_edges: state.flowEditorReducer.selected_out_edges,
      zoom: state.flowEditorReducer.zoom,
      flow: state.flowEditorReducer.flow,
      originalFlow: state.flowEditorReducer.originalFlow,
      navigation: state.flowEditorReducer.navigation,
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
      deleteCache (...args) {
        dispatch(deleteCacheAction(...args))
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
      updateDataFrameDetail (...args) {
        dispatch(updateDataFrameDetailAction(...args))
      },
      notify (...args) {
        return dispatch(addNotification(...args))
      },
      updateNotify (...args) {
        return dispatch(updateNotification(...args))
      },
      dismissNotify (...args) {
        setTimeout(() => {
          dispatch(removeNotification(...args))
        }, 1000)
      },
      addNote (...args) {
        dispatch(addNoteAction(...args))
      },
      sortStepSrcEnd (...args) {
        dispatch(sortStepSrcEndAction(...args))
      }
    }
  },
)(FlowEditor)