import Constants from '../constants/index'
import DataSourcePropertyModel from './DataSourcePropertyModel'
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

export default class DataSourceModel {

  id: string;
  type: string;
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
    this.type = props.type;
    this.operator = props.operator //データソースには不要なはずだが APIのexecuteができないため追加
    this.setPosition(props.position)
    this.setSize(props.size)
    this.text = props.text
    this.property = (props.property)?props.property:{hasData:false}
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

  getFileName(){
    //TODO ファイル名を o と file_name のいずれかから取得するようにしているが将来変更する
    let filenames = (this.parameters.o)?this.parameters.o:(this.parameters.file_name)?this.parameters.file_name:null
    if(!filenames)return null
    let filename_array = filenames.split("/")
    let filename = filename_array[filename_array.length - 1]
    return filename
  }
}