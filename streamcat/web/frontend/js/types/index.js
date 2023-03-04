import { CommandStepModel, DataFrameStepModel, NoteStepModel, SubflowCommandModel, SubFlowStepModel } from 'Model/index'
import CommandModel from 'Model/Command/CommandModel'

export type StepModelType = CommandStepModel | SubFlowStepModel | DataFrameStepModel | NoteStepModel
export type CommandParamType = {
  label: string;
  name: string;
  optional?: boolean;
  options: any;
  type: string;
  default?: string | number;
}

export type CommandModelType = CommandModel | SubflowCommandModel;

export type CommandPortType = {
  name: string;
  type: string;
}

export type MastType =  {
  commands: any[],
  subflows: any[],
  visualizers: any[]
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
