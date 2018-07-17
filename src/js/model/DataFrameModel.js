import Constants from '../constants/index'
import ModelUtil from '../utils/ModelUtil'

type stepType = "command" | "frame"
type dataSourceType = "csv"
export type DataFrameModelProps = {
  id?: string;
  type: stepType;
  name: string;
  uuid: string;
  dataSource: dataSourceType;
  asFlowIn: boolean;
  asFlowOut: boolean;
  position?: { x: number, y: number };
  size?: { width: number, height: number };
}

export default class DataFrameModel {
  id: string
  type: stepType
  name: string
  uuid: string
  dataSource: dataSourceType
  asFlowIn: boolean
  asFlowOut: boolean
  position: { x: number, y: number } = {x: 0, y: 0}
  size: { width: number, height: number } = {width: 0, height: 0}

  constructor (props: DataFrameModelProps) {
    //TODO エディターから作るときのIDを将来的にどうするか決める
    this.id = (props.id) ? props.id : ModelUtil.getId()
    this.type = props.type
    this.name = props.name
    this.uuid = props.uuid
    this.dataSource = props.dataSource
    this.asFlowIn = props.asFlowIn
    this.asFlowOut = props.asFlowOut
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