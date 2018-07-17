import Constants from '../constants/index'
import ModelUtil from '../utils/ModelUtil'
import BaseModel from './BaseModel'
import BaseModelProps from './BaseModel'

type stepType = "command" | "frame"

export type StepModelProps = {
  ...BaseModelProps,
  srcs: [];
  dsts: [];
  args: {};
}

export default class StepModel extends BaseModel{
  srcs: [] = []
  dsts: [] = []
  args: {}
  position: { x: number, y: number } = {x: 0, y: 0}
  size: { width: number, height: number } = {width: 0, height: 0}

  constructor (props: StepModelProps) {
    super(props)
    //TODO エディターから作るときのIDを将来的にどうするか決める
    this.srcs = props.srcs
    this.dsts = props.dsts
    this.args = props.args
  }
}