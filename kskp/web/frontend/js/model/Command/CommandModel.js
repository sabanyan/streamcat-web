//@flow
import type { CommandParamType, CommandPortType } from 'Types/index'
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
  classification: string
  description: string
  id: string
  label: string = null
  params: [CommandParamType] = []
  groups: []
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