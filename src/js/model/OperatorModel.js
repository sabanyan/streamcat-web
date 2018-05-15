// @flow
import ModelUtil from '../utils/ModelUtil'

type Props = {
  id?:string;
  operator:string;
  position?:{x:number,y:number};
  size?:{width:number,height:number};
  text:string;
  property?:{};
  parameters:{};
}


export default class OperatorModel{

  id: string;
  operator: ?string;
  position: { x: number, y: number };
  size: { width: number, height: number };
  width: number;
  height: number;
  text: string;
  property: ?{};
  parameters: ?{};

  constructor (props:Props) {
    this.id = (props.id)?props.id: ModelUtil.getId();
    this.operator = props.operator
    this.position = (props.position)?props.position:{x:0,y:0}
    this.size = (props.size)?props.size:{width:0,height:0}
    this.text = props.text
    this.property = (props.property)?props.property:{}
    this.parameters = props.parameters
  }

  setPosition (x:number, y:number) {
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