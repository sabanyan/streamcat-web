import {FlowModel} from "Model/index";
import {DragType} from "Types/index";

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
  nodes: any[];
  selected_step_ids: string[];
  selected_tab_id: string;
  children: React.ReactNode;
  dragStart: Function;
  dragging: Function;
  dragEnd: Function;
  setZoom: Function;
  zoom: number;
  history: any;
  mast: any;
  position: any;
  flow: FlowModel;
  drag: DragType;
  inspector:{width:number};
  editor: {};
  selected_data_source_detail: Function;
  sortStepSrcEnd: Function;
  deleteSelectStep: Function;
  notify: Function;
  updateNotify: Function;
  dismissNotify: Function;
  addNote: Function;
  sortStepSrcEndAction: Function;
  moveSteps: Function;
  resizeInspector: Function;
  setMode: Function;
}
