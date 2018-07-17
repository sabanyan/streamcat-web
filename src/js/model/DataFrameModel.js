import Constants from '../constants/index'
import ModelUtil from '../utils/ModelUtil'
import StepModel from './StepModel'
import type { BaseModelProps } from './BaseModel'
import BaseModel from './BaseModel'

type stepType = "command" | "frame"
type dataSourceType = "csv"

export type DataFrameModelProps = {
  ...BaseModelProps,
  uuid: string;
  dataSource: dataSourceType;
  asFlowIn: boolean;
  asFlowOut: boolean;
}

export default class DataFrameModel extends BaseModel{
  uuid: string
  dataSource: dataSourceType
  asFlowIn: boolean
  asFlowOut: boolean

  constructor (props: DataFrameModelProps) {
    super(props)
    this.uuid = props.uuid
    this.dataSource = props.dataSource
    this.asFlowIn = props.asFlowIn
    this.asFlowOut = props.asFlowOut
  }
}