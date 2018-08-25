//@flow
import Constants from '../../constants/index'
import ModelUtil from '../../utils/ModelUtil'
import type { CommandParamType, CommandPortType } from '../../types'
import Model from '../index'

type stepType = "command" | "frame"

export type CommandModelProps = {
  classification: string;
  description: string;
  id: string;
  label: string;
  params: [CommandParamType];
  ports: [CommandPortType];
  version: string;
}

export default class CommandModel extends Model {
  classification: string
  description: string
  id: string
  label: string = null
  params: [CommandParamType] = []
  ports: [CommandPortType] = [[],[]]
  version: string

  constructor (props: CommandModelProps) {
    super(props)
    this.initialize(props,"classification")
    this.initialize(props,"description")
    this.initialize(props,"id")
    this.initialize(props,"label")
    this.initialize(props,"params")
    this.initialize(props,"ports")
    this.initialize(props,"version")
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