// @flow
import type { BaseModelProps } from './BaseModel'
import BaseModel from './BaseModel'

type dataSourceType = "csv"

export type DataFrameStepModelProps = {
  ...BaseModelProps,
  uuid: string;
  dataSource: dataSourceType;
}

export default class DataFrameStepModel extends BaseModel{
  uuid: string = null
  dataSource: dataSourceType
  constructor (props: DataFrameStepModelProps) {
    super(props)
    this.initialize(props,"uuid")
    this.initialize(props,"dataSource")
  }

  hasData():boolean{
    return (this.uuid)
  }
}
