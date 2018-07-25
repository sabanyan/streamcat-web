import Constants from '../../constants/index'
import ModelUtil from '../../utils/ModelUtil'

type stepType = "command" | "frame"

type paramType = {
  label: string;
  name: string;
  type: string;
}

type portType = {
  name: string;
  type: string;
}

export type CommandModelProps = {
  id: string;
  label: string;
  params: [paramType];
  ports: [portType];
  version: string;
}

export default class CommandModel {
  id: string
  label: string
  params: [paramType]
  ports: [portType]
  version: string

  constructor (props: CommandModelProps) {
    this.id = props.id
    this.label = props.label
    this.params = props.params
    this.ports = props.ports
    this.version = props.version
  }

  getInPorts(){
    return this.ports[0]
  }

  getOutPorts(){
    return this.ports[1]
  }
}