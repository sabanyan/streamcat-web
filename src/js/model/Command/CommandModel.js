//@flow
import type { CommandParamType, CommandPortType } from 'Types/index'
import Model from 'Model/index'

type stepType = 'command' | 'frame'

export type CommandModelProps = {
  classification: string;
  description: string;
  id: string;
  label: string;
  params: [CommandParamType];
  ports: [CommandPortType];
  version: string;
  rules: {};
}

export default class CommandModel extends Model {
  classification: string
  description: string
  id: string
  label: string = null
  params: [CommandParamType] = []
  ports: [CommandPortType] = [[], []]
  rules: {} = {}
  version: string

  constructor (props: CommandModelProps) {
    super(props)
    this.initialize(props, 'classification')
    this.initialize(props, 'description')
    this.initialize(props, 'id')
    this.initialize(props, 'label')
    this.initialize(props, 'params')
    this.initialize(props, 'ports')
    this.initialize(props, 'version')
    this.initialize(props, 'rules')
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