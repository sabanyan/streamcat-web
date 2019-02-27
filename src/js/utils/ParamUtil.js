//@flow
import Constants from '../constants'
import ParamString from '../components/shared/Param/ParamString'
import ParamBoolean from '../components/shared/Param/ParamBoolean'
import * as React from 'react'
import ParamSelect from '../components/shared/Param/ParamSelect'
import ParamNumber from '../components/shared/Param/ParamNumber'

export default class ParamUtil {
  static clearElement(element){
    element.value = ""
    element.checked = false
  }

  static getArgsFromInputRefs(inputRefs:[]):{}{
    let args = {}
    //モーダルで入力されたパラメータを取得
    inputRefs.map((inputRef) => {
      switch (inputRef.param.type){
        case Constants.param.type.number:
          args[inputRef.param.name] = inputRef.element.value
          break
        case Constants.param.type.string:
          args[inputRef.param.name] = inputRef.element.value
          break
        case Constants.param.type.boolean:
          args[inputRef.param.name] = (inputRef.element.checked)?true:false
          break
        case Constants.param.type.select:
          args[inputRef.param.name] = this.getAllSelectedValue(inputRef.element)
          break
        case Constants.param.type.column:
          args[inputRef.param.name] = this.getAllSelectedValue(inputRef.element)
          break
      }
      ParamUtil.clearElement(inputRef.element)
    })
    return args
  }

  static getAllSelectedValue(element){
    if(element.multiple){
      return Array.from(element.selectedOptions).map(v=>v.value);
    }else{
      return element.value
    }
  }

  static getParamElement(param,onBuild,defaultValue,refValue,headers){
    let paramElement
    switch(param.type){
      case Constants.param.type.number:
        paramElement = <ParamNumber param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
      case Constants.param.type.string:
        paramElement = <ParamString param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
      case Constants.param.type.boolean:
        paramElement = <ParamBoolean param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
      case Constants.param.type.select:
        paramElement = <ParamSelect param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
      default:
        paramElement = <ParamString param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild} disabled={true}/>
        break
      case Constants.param.type.column:


        //カラム情報を付与
        param.options = {
          labels: headers,
          values: headers,
          multiple: (param.options.multiple)?true:false
        }

        paramElement = <ParamSelect param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
    }
    return paramElement
  }
}