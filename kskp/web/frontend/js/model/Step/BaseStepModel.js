//@flow
import ModelUtil from '../../utils/ModelUtil'
import Model from '../index'

type stepType = 'command' | 'frame'

export type BaseModelProps = {
  id?: string;
  type: stepType;
  label?: string;
  position?: { x: number, y: number };
  size?: { width: number, height: number };
  invalid?: boolean;
  error?: boolean;
}

export default class BaseStepModel extends Model {
  id: string
  type: stepType
  label: string
  position: { x: number, y: number } = {x: 0, y: 0}
  size: { width: number, height: number } = {width: 0, height: 0}
  invalid: {} = {}
  error: {} = {}

  constructor (props: BaseModelProps) {
    super(props)
    this.initialize(props, 'id')
    this.initialize(props, 'type')
    this.initialize(props, 'label')
    this.initialize(props, 'invalid')
    this.initialize(props, 'error')
    this.setPosition(props.position)
    this.setSize(props.size)
    if (!this.id) {
      this.id = ModelUtil.getNewId(this.type)
    }
    if (!this.label) {
      this.label = this.id
    }
  }

  getLabel () {
    if (this.label) return this.label
    this.label = this.id
    return this.id
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