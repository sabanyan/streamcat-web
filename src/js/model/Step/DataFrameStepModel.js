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
  uuid: string
  dataSource: dataSourceType
  constructor (props: DataFrameStepModelProps) {
    super(props)
    this.uuid = props.uuid
    this.dataSource = props.dataSource
  }

  hasData():boolean{
    return (this.uuid)
  }
}
