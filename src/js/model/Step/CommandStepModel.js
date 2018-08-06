import Constants from '../../constants/index'
import ModelUtil from '../../utils/ModelUtil'
import BaseModel from './BaseModel'
import BaseModelProps from './BaseModel'

type stepType = "command" | "frame"

export type CommandStepModelProps = {
  ...BaseModelProps,
  srcs: {};
  dsts: {};
  args: {};
  commandId: string;
}

export default class CommandStepModel extends BaseModel{
  srcs: {} = {}
  dsts: {} = {}
  args: {} = {}
  commandId: string
  constructor (props: CommandStepModelProps) {
    super(props)
    this.initialize(props,"srcs")
    this.initialize(props,"dsts")
    this.initialize(props,"args")
    this.initialize(props,"commandId")
  }
}