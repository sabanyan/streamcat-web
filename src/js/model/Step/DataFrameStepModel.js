// @flow
import type { BaseModelProps } from './BaseStepModel'
import BaseStepModel from './BaseStepModel'

type dataSourceType = "csv"

export type DataFrameStepModelProps = {
  ...BaseModelProps,
  uuid: string;
  dataSource: dataSourceType;
}

export default class DataFrameStepModel extends BaseStepModel{
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
