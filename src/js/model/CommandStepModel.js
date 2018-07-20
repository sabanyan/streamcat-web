import Constants from '../constants/index'
import ModelUtil from '../utils/ModelUtil'
import BaseModel from './BaseModel'
import BaseModelProps from './BaseModel'

type stepType = "command" | "frame"

export type CommandStepModelProps = {
  ...BaseModelProps,
  srcs: [];
  dsts: [];
  args: {};
}

export default class CommandStepModel extends BaseModel{
  srcs: [] = []
  dsts: [] = []
  args: {}

  constructor (props: CommandStepModelProps) {
    super(props)
    this.srcs = props.srcs
    this.dsts = props.dsts
    this.args = props.args
  }
}