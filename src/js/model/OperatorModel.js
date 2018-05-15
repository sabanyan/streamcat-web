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
  position: { x: number, y: number } = {x:0,y:0};
  size: { width: number, height: number } = {width:0,height:0};
  width: number;
  height: number;
  text: string;
  property: ?{} = {};
  parameters: ?{} = {};

  constructor (props:Props) {
    this.id = (props.id)?props.id: ModelUtil.getId();
    this.operator = props.operator
    this.setPosition(props.position)
    this.setSize(props.size)
    this.text = props.text
    this.property = (props.property)?props.property:{}
    this.parameters = props.parameters
  }

  setPosition (position:?{x:number, y:number}) {
    if(position){
      this.position.x = position.x
      this.position.y = position.y
    }
  }

  setSize (size:?{width:number, height:number}) {
    if(size){
      this.size.width = size.width
      this.size.height = size.height
    }
  }

  setFrame (frame:{x:number, y:number, width:number, height:number}) {
    this.setPosition({x:frame.x,y:frame.y})
    this.setSize({width:frame.width, height:frame.height})
  }
}