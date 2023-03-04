import { CommandModel, CommandStepModel, DataFrameStepModel, NoteStepModel, SubflowCommandModel, SubFlowStepModel } from 'Model/index'

export type StepModelType = CommandStepModel | SubFlowStepModel | DataFrameStepModel | NoteStepModel

export type CommandParamType = {
  label: string;
  name: string;
  description: string;
  optional?: boolean;
  options: any;
  type: string;
  helper: any;
  resizable: boolean;
  isPassword: boolean;
  default?: string | number;
  section: string
  elements: CommandParamType[];
}

export type CommandModelType = CommandModel | SubflowCommandModel;

export type CommandPortType = {
  name: string;
  type: string;
}

export type MastType =  {
  commands: any[];
  visualizers: any[];
  subflows: any[];
  datasrcs: any[];
  datadsts: any[];
}

export type HistoryType = {
  current: number,
  nodes: []
}

export type DragType = {
  start: {
    x: number,
    y: number
  },
  end: {
    x: number,
    y: number
  }
}

export type GraphType = {
  width: number;
  height: number;
  edges: any[];
  nodes: any[];
}

export type dropDownListItem = {
  label: string,
  value: string,
  object?: {}
}
