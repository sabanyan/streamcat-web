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
  moveStepsAction
 } from 'Modules/application'
import FlowEditor from 'Components/FlowEditorContainer/FlowEditor'
import { connect } from 'react-redux'
import * as React from 'react'
import { FlowModelProps } from 'Model/Flow/FlowModel'
import { DataFrameDetailType, DragType, GraphType, MastType, StepModelType } from 'Types/index'
import { addNotification, removeNotification, updateNotification } from 'reapop'
import {apiActions} from 'Modules/api/index'
import { LocksModel } from 'Model/index';

export type FlowEditorProps = {
  projectId: string,
  projectName: string,
  graph: any;
  loadFlowJSON: Function;
  addMaster: Function;
  addStep: Function;
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
  children: React.ReactNode;
  locks: LocksModel;
  dragStart: Function;
  dragging: Function;
  dragEnd: Function;
  setZoom: Function;
  zoom: number;
  history: any;
  mast: any;
  position: any;
  flow: FlowModelProps;
  drag: DragType;
  selected_data_source_detail: Function;
  sortStepSrcEnd: Function;
  deleteSelectStep: Function;
  notify: Function;
  updateNotify: Function;
  dismissNotify: Function;
  addNote: Function;
  sortStepSrcEndAction: Function;
  newLocks: Function;
  updateLocks: Function;
  moveSteps: Function;
}

const FlowEditorContainer = connect(
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
      locks: state.apiReducer.locks,
      originalFlow: state.flowEditorReducer.originalFlow,
      navigation: state.flowEditorReducer.navigation,
    }
  },
  dispatch => {
    
    return {
      newLocks (flowUUID:string) {
        return dispatch(apiActions.NewLocks(flowUUID))
      },
      updateLocks (locks:LocksModel) {
        return dispatch(apiActions.UpdateLocks(locks))
      },
      loadFlowJSON (context: {}) {
        return dispatch(loadFlowJSONAction(context))
      },
      addMaster (context: {}) {
        dispatch(addMasterAction(context))
      },
      addStep (add_step: StepModelType, src_step_ids: [] = [], dst_step_ids: [] = []) {
        dispatch(addStepAction(add_step,src_step_ids,dst_step_ids))
      },
      updateStep (step: StepModelType) {
        dispatch(updateStepAction(step))
      },
      updateFlow (flow) {
        dispatch(updateFlowAction(flow))
      },
      selectSteps (selected_steps: []) {
        dispatch(selectStepsAction(selected_steps))
      },
      addSelectStep (selected_step_id: string) {
        dispatch(addSelectStepAction(selected_step_id))
      },
      deleteSelectStep (selected_step_id: string) {
        dispatch(deleteSelectStepAction(selected_step_id))
      },
      deleteSteps (step_ids: []) {
        dispatch(deleteStepsAction(step_ids))
      },
      deleteCache (selected_step_id: string) {
        dispatch(deleteCacheAction(selected_step_id))
      },
      cutSteps (step_ids: []) {
        dispatch(cutStepsAction(step_ids))
      },
      copySteps (step_ids: []) {
        dispatch(copyStepsAction(step_ids))
      },
      pasteSteps (paste_nodes: []) {
        dispatch(pasteStepsAction(paste_nodes))
      },
      addHistory () {
        dispatch(addHistoryAction())
      },
      undo () {
        dispatch(undoAction())
      },
      redo () {
        dispatch(redoAction())
      },
      sortFlow () {
        dispatch(sortFlowAction())
      },
      executeFlow (flowid: string) {
        // flowidは未使用
        dispatch(executeFlowAction(flowid))
      },
      selectTab (tab_id: string) {
        dispatch(selectTabAction(tab_id))
      },
      dragStart (x: number, y: number) {
        dispatch(dragStartAction(x,y))
      },
      dragging (x: number, y: number) {
        dispatch(draggingAction(x,y))
      },
      dragEnd (x: number, y: number) {
        dispatch(dragEndAction(x,y))
      },
      setZoom ({offset, value}) {
        dispatch(setZoomAction({offset, value}))
      },
      updateDataFrameDetail (detail: DataFrameDetailType) {
        dispatch(updateDataFrameDetailAction(detail))
      },
      notify (context:{}) {
        return dispatch(addNotification(context))
      },
      updateNotify (context:{}) {
        return dispatch(updateNotification(context))
      },
      dismissNotify (id:string) {
        setTimeout(() => {
          dispatch(removeNotification(id))
        }, 1000)
      },
      addNote (x: number, y: number) {
        dispatch(addNoteAction(x,y))
      },
      sortStepSrcEnd (detail: {}, mouseEvent: {}) {
        // mouseEventは未使用
        dispatch(sortStepSrcEndAction(detail,mouseEvent))
      },
      moveSteps(x:number, y:number, model) {
        dispatch(moveStepsAction(x,y,model))
      }
    }
  },
)(FlowEditor)

export default FlowEditorContainer
