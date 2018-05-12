import ModelUtil from '../utils/ModelUtil'

export default class OperatorModel {

  constructor ({id = ModelUtil.getId(), operator = null,position={x:0,y:0},size={width:0,height:0}, width = null, height = null, text = "",property = {},parameters = {} } = {}) {
    this.id = id
    this.operator = operator
    this.position = position
    this.size = size
    this.text = text
    this.property = property
    this.parameters = parameters
  }

  setPosition (x , y) {
    this.position.x = x
    this.position.y = y
  }

  setSize (width, height) {
    this.size.width = width
    this.size.height = height
  }

  setFrame (x, y, width, height) {
    this.setPosition(x, y)
    this.setSize(width, height)
  }
}