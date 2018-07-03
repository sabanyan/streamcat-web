import Constants from '../constants/index'
import ModelUtil from '../utils/ModelUtil'

type stepType = "command" | "frame"

export type StepModelProps = {
  id?: string;
  type: stepType;
  name: string;
  label: string;
  args: {};
  position?: { x: number, y: number };
  size?: { width: number, height: number };
  hasData: boolean;
}

export default class StepModel {
  id: string
  type: stepType
  name: string
  label: string
  args: {}
  position: { x: number, y: number } = {x: 0, y: 0}
  size: { width: number, height: number } = {width: 0, height: 0}
  hasData: boolean = false

  constructor (props: StepModelProps) {
    //TODO エディターから作るときのIDを将来的にどうするか決める
    this.id = (props.id) ? props.id : ModelUtil.getId()
    this.type = props.type
    this.name = props.name
    this.label = props.label
    this.args = props.args
    this.hasData = props.hasData
    this.setPosition(props.position)
    this.setSize(props.size)
  }

  setPosition (position: ?{ x: number, y: number }) {
    if (position) {
      this.position.x = position.x
      this.position.y = position.y
    }
  }

  setSize (size: ?{ width: number, height: number }) {
    if (size) {
      this.size.width = size.width
      this.size.height = size.height
    }
  }

  setFrame (frame: { x: number, y: number, width: number, height: number }) {
    this.setPosition({x: frame.x, y: frame.y})
    this.setSize({width: frame.width, height: frame.height})
  }

}