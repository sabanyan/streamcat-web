//@flow
import Model from "Model/Core";

export type VisualizeModelProps = {
  classification: string,
  description: string,
  id: string,
  label: string,
  params: [],
  groups: [],
  ports: [],
  url: string,
  version: string,
}

export default class VisualizeModel<VisualizeModelProps> extends Model {
  classification = ''
  description = ''
  id: string = ''
  order = -1
  label: string = ''
  params: [] = []
  groups: [] = []
  ports: [[], []] = [[], []]
  url = ''
  version = ''

  constructor (props: VisualizeModelProps) {
    super()
    this.initialize(props, 'classification')
    this.initialize(props, 'description')
    this.initialize(props, 'id')
    this.initialize(props, 'order')
    this.initialize(props, 'label')
    this.initialize(props, 'params')
    this.initialize(props, 'groups')
    this.initialize(props, 'ports')
    this.initialize(props, 'url')
    this.initialize(props, 'version')
  }

}