import DataFrameStepModel from './DataFrameStepModel'
import CommandStepModel from './CommandStepModel'
import SubFlowStepModel from './SubFlowStepModel'
export type StepModelType = CommandStepModel|SubFlowStepModel|DataFrameStepModel
export type CommandParamType = {
  label: string;
  name: string;
  type: string;
}
export type CommandPortType = {
  name: string;
  type: string;
}