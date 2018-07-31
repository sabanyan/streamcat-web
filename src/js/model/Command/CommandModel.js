import Constants from '../../constants/index'
import ModelUtil from '../../utils/ModelUtil'
import type { CommandParamType, CommandPortType } from '../../types'

type stepType = "command" | "frame"

export type CommandModelProps = {
  id: string;
  label: string;
  params: [CommandParamType];
  ports: [CommandPortType];
  version: string;
}

export default class CommandModel {
  id: string
  label: string
  params: [CommandParamType]
  ports: [CommandPortType]
  version: string

  constructor (props: CommandModelProps) {
    this.id = props.id
    this.label = props.label
    this.params = props.params
    this.ports = props.ports
    this.version = props.version
  }

  getInPorts():[CommandPortType]{
    return this.ports[0]
  }

  getOutPorts():[CommandPortType]{
    return this.ports[1]
  }

  getParams():[CommandParamType]{
    return this.params
  }
}