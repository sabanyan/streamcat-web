import {BaseModelProps} from "Model/Step/BaseStepModel";
import {BaseStepModel, FlowModel} from "Model/index";


export interface DataSourceStepModelProps extends BaseModelProps{
  uuid: string|null
  description: string
  flow: FlowModel
  params: any[]
  ports: [any[], any[]]
}

export default class DataSourceStepModel extends BaseStepModel {
  uuid: string|null
  description: string
  flow: FlowModel
  params: any[]
  ports: [any[], any[]]

  constructor (props: DataSourceStepModelProps) {
    super(props)
    this.initialize(props, 'id')
    this.initialize(props, 'uuid')
    this.initialize(props, 'dataSource')
    this.initialize(props, 'makeCache')
    this.initialize(props, 'cacheCreatedAt')
  }


}
