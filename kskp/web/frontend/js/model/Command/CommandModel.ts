import { CommandParamType, CommandPortType } from 'Types/index'
import Model from "Model/Core";

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
  classification: string | undefined = undefined
  description: string | undefined = undefined
  id: string | undefined = undefined
  label: string | null = null
  params: any[CommandParamType] = []
  groups: string[] | undefined = undefined
  ports: any[CommandPortType] = [[], []]
  rules: {} = {}
  version: string | undefined = undefined

  constructor (props: CommandModelProps) {
    super()
    this.initialize(props, 'classification')
    this.initialize(props, 'description')
    this.initialize(props, 'id')
    this.initialize(props, 'label')
    this.initialize(props, 'params')
    this.initialize(props, 'groups')
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

  isInPortsAddable():boolean {
    let result = false
    const ports = this.getInPorts()
    if (ports[0] && ports[0].name === '*') result = true

    return result
  }

  isOutPortsAddable():boolean {
    let result = false
    const ports = this.getOutPorts()
    if (ports[0] && ports[0].name === '*') result = true

    return result
  }
}
