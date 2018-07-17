import type { BaseModelProps } from './BaseModel'
import BaseModel from './BaseModel'

type stepType = "command" | "frame"
type dataSourceType = "csv"

export type DataFrameStepModelProps = {
  ...BaseModelProps,
  uuid: string;
  dataSource: dataSourceType;
  asFlowIn: boolean;
  asFlowOut: boolean;
}

export default class DataFrameStepModel extends BaseModel{
  uuid: string
  dataSource: dataSourceType
  asFlowIn: boolean
  asFlowOut: boolean

  constructor (props: DataFrameStepModelProps) {
    super(props)
    this.uuid = props.uuid
    this.dataSource = props.dataSource
    this.asFlowIn = props.asFlowIn
    this.asFlowOut = props.asFlowOut
  }
}