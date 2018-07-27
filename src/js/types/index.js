import CommandStepModel from '../model/Step/CommandStepModel'
import SubFlowStepModel from '../model/Step/SubFlowStepModel'
import DataFrameStepModel from '../model/Step/DataFrameStepModel'

export type StepModelType = CommandStepModel|SubFlowStepModel|DataFrameStepModel
export type CommandParamType = {
  label: string;
  name: string;
  type: string;
}

export type SubFlowParamType = {
  name: string;
}

export type CommandPortType = {
  name: string;
  type: string;
}

export type FlowListDataType = {
  label: string;
  nodes: [StepModelType];
  ports: [];
  projectId: number;
  uuid: string;
}