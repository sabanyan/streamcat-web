// @flow
import type { BaseModelProps } from './BaseStepModel'
import BaseStepModel from './BaseStepModel'

type dataSourceType = "csv"

export type DataFrameStepModelProps = {
  ...BaseModelProps,
  uuid: string;
  dataSource: dataSourceType;
  makeCache: boolean;
  cacheCreatedAt: string;
}

export default class DataFrameStepModel extends BaseStepModel{
  uuid: string = null
  dataSource: dataSourceType
  makeCache: boolean = false
  cacheCreatedAt: string = ""
  constructor (props: DataFrameStepModelProps) {
    super(props)
    this.initialize(props,"uuid")
    this.initialize(props,"dataSource")
    this.initialize(props,"makeCache")
    this.initialize(props,"cacheCreatedAt")
  }

  hasData():boolean{
    return (this.uuid)
  }

  isCached():boolean{
    return (this.cacheCreatedAt === "") ? false : true
  }
  isMakeCache():boolean {
    return this.makeCache
  }

  getCacheCreatedAt():boolean {
    return this.cacheCreatedAt
  }

  setMakeCache(flag:boolean) {
    this.makeCache = flag
    
    return this.makeCache
  }

  setEmptyCache() {
    this.cacheCreatedAt = ""
    this.uuid = null
  }

  validate(){

  }
}
