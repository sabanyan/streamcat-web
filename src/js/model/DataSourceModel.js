import Constants from '../constants/index'
import DataSourcePropertyModel from './DataSourcePropertyModel'
import ModelUtil from '../utils/ModelUtil'

export default class DataSourceModel {
  constructor ({id = ModelUtil.getId(), type = null,operator = null,position={x:0,y:0},size={width:0,height:0}, text = "", property = {hasData:false},parameters = {}  } = {}) {
    this.id = id
    this.type = type
    this.operator = operator //データソースには不要なはずだが APIのexecuteができないため追加
    this.position = position
    this.size = size
    this.text = text
    this.property = {
      hasData: property.hasData,
      // overview: {
      //   count: property.overview.count,
      //   created_at: property.overview.created_at,
      //   created_user_name: property.overview.created_user_name
      // }
    }
    this.parameters = parameters
  }

  setPosition (x, y) {
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

  getFileName(){
    //TODO ファイル名を o と file_name のいずれかから取得するようにしているが将来変更する
    let filenames = (this.parameters.o)?this.parameters.o:(this.parameters.file_name)?this.parameters.file_name:null
    if(!filenames)return null
    let filename_array = filenames.split("/")
    let filename = filename_array[filename_array.length - 1]
    return filename
  }
}