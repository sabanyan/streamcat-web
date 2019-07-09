import { CommandParamType, CommandPortType } from 'Types'
import Model from "Model/Core";

type stepType = 'command' | 'frame'

export type CommandModelProps = {
  classification: string;
  description: string;
  id: string;
  label: string | null;
  params: CommandParamType[];
  ports: [CommandPortType];
  version: string;
  rules: {};
}

export default class CommandModel extends Model {
  classification: string
  description: string
  id: string
  label: string | null = null
  params: CommandParamType[] = []
  ports: [CommandPortType[], CommandPortType[]] = [[], []]
  rules: {} = {}
  version: string

  constructor (props: CommandModelProps) {
    super()
    this.classification = this.initialize(props, 'classification')
    this.description = this.initialize(props, 'description')
    this.id = this.initialize(props, 'id')
    this.label = this.initialize(props, 'label')
    this.params = this.initialize(props, 'params')
    this.ports = this.initialize(props, 'ports')
    this.version = this.initialize(props, 'version')
    this.rules = this.initialize(props, 'rules')
  }

  getInPorts (): CommandPortType[] {
    return this.ports[0]
  }

  getOutPorts (): CommandPortType[] {
    return this.ports[1]
  }

  getParams (): CommandParamType[] {
    return this.params
  }

  getLabel () {
    return this.label
  }

  getParam (key: string): CommandParamType | undefined {
    return this.params.find(param => (param.name === key))
  }
}