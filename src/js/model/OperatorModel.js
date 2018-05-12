// @flow
import ModelUtil from '../utils/ModelUtil'

type TOperatorModel = {
  id:string;
  operator:{};
  position:{
    x:number,
    y:number
  };
  size:{
    width:number,
    height:number
  };
  text:string;
  property:{};
  parameters:{};
}

export default class OperatorModel<TOperatorModel> {
  id:string = ModelUtil.getId();
  operator:{};
  position:{
    x:number,
    y:number
  } = {
    x: 0,
    y: 0
  };
  size:{
    width:number,
    height:number
  };
  text:string;
  property:{};
  parameters:{};

  constructor (model:TOperatorModel) {
    this.id = model.id
    this.operator = model.operator
    this.position = model.position
    this.size = model.size
    this.text = model.text
    this.property = model.property
    this.parameters = model.parameters
  }

  setPosition (x:number, y:number) {
    console.log(this.position)
    this.position.x = x
    this.position.y = y
  }

  setSize (width:number, height:number) {
    this.size.width = width
    this.size.height = height
  }

  setFrame (x:number, y:number, width:number, height:number) {
    this.setPosition(x, y)
    this.setSize(width, height)
  }
}

const a = new OperatorModel(model);