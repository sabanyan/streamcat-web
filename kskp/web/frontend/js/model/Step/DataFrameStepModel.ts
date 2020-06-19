// @flow
import { BaseModelProps } from 'Model/Step/BaseStepModel'
import { BaseStepModel } from 'Model/index'

type dataSourceType = 'csv'

export interface DataFrameStepModelProps extends BaseModelProps{
  uuid: string|null
  dataSource: string | undefined;
  makeCache?: boolean;
  cacheCreatedAt?: string;
}

export default class DataFrameStepModel extends BaseStepModel {
  uuid: string|null = null
  dataSource: dataSourceType | undefined = undefined
  makeCache: boolean = false
  cacheCreatedAt: string|null = null

  constructor (props: DataFrameStepModelProps) {
    super(props)
    this.initialize(props, 'uuid')
    this.initialize(props, 'dataSource')
    this.initialize(props, 'makeCache')
    this.initialize(props, 'cacheCreatedAt')
  }

  hasData (): boolean {
    return !!(this.uuid)
  }

  isCached (): boolean {
    return (this.cacheCreatedAt === null) ? false : true
  }

  isMakeCache (): boolean {
    return this.makeCache
  }

  getCacheCreatedAt (): string|null {
    return this.cacheCreatedAt
  }

  setMakeCache (flag: boolean) {
    this.makeCache = flag

    return this.makeCache
  }

  deleteCache () {
    this.cacheCreatedAt = null
    this.uuid = null
  }

  validate () {

  }
}
