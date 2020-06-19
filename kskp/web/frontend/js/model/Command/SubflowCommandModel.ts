import { CommandParamType, CommandPortType, SubFlowCommandParamType } from 'Types/index'
import Model from "Model/Core";

export default class SubflowCommandModel extends Model {
  id: string | undefined = undefined
  createdAt: string | undefined = undefined
  creator: string | undefined = undefined
  description: string | undefined = undefined
  label: string | undefined = undefined
  nodes: [] = []
  params: any[CommandParamType] = []
  ports: any[CommandPortType] = [[], []]
  projectId: string | undefined = undefined
  projectName: string | undefined = undefined
  uuid: string | undefined = undefined
  classification: string = 'subflow'
  rules: {} = {}

  constructor (props: SubFlowCommandParamType) {
    super()
    this.id = props.uuid //サブフローのIDはUUIDとする
    this.initialize(props, 'createdAt')
    this.initialize(props, 'creator')
    this.initialize(props, 'description')
    this.initialize(props, 'label')
    this.initialize(props, 'nodes')
    this.initialize(props, 'params')
    this.initialize(props, 'ports')
    this.initialize(props, 'projectId')
    this.initialize(props, 'projectName')
    this.initialize(props, 'uuid')
    this.init()
  }

  init() {
    if (this.params) {
      this.params = this.params.map(param => {
        if (!param.label) {
          param['label'] = param.name
        }
        return param
      })
    }
  }

  getInPorts (): [CommandPortType] {
    return this.ports[0]
  }

  getOutPorts (): [CommandPortType] {
    return this.ports[1]
  }

  getParams (): [CommandParamType] {
    return this.params
  }

  getLabel () {
    return this.label
  }

  getParam (key: string): CommandParamType {
    let result: CommandParamType = {}
    this.params.find(param => {
      if (param.name === key) result = param
    })
    return result
  }
}
