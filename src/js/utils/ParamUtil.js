//@flow
import Constants from '../constants'
import ParamString from '../components/shared/Param/ParamString'
import ParamBoolean from '../components/shared/Param/ParamBoolean'
import * as React from 'react'

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
        case Constants.param.type.string:
          args[inputRef.param.name] = inputRef.element.value
          break
        case Constants.param.type.boolean:
          args[inputRef.param.name] = (inputRef.element.checked)?true:false
          break
      }
      ParamUtil.clearElement(inputRef.element)
    })
    return args
  }

  static getParamElement(param,onBuild,defaultValue,refValue){
    let paramElement
    switch(param.type){
      case Constants.param.type.string:
        paramElement = <ParamString param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
      case Constants.param.type.boolean:
        paramElement = <ParamBoolean param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}/>
        break
      default:
        paramElement = <ParamString param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild} disabled={true}/>
        break
    }
    return paramElement
  }
}