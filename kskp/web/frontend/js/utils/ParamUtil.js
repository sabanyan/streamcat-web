//@flow
import Constants from 'Constants/index'
import { ParamBoolean, ParamNumber, ParamSelect, ParamString, ParamList } from 'Shared/Inspector'
import * as React from 'react'

export default class ParamUtil {
  static clearElement (element) {
    element.value = ''
    element.checked = false
  }

  static getArgsFromInputRefs (inputRefs: []): {} {
    let args = {}
    //モーダルで入力されたパラメータを取得
    inputRefs.map((inputRef) => {
      switch (inputRef.param.type) {
        case Constants.param.type.number:
          args[inputRef.param.name] = (inputRef.element.value !== '') ? parseInt(inputRef.element.value) : null
          break
        case Constants.param.type.string:
          args[inputRef.param.name] = inputRef.element.value
          break
        case Constants.param.type.boolean:
          args[inputRef.param.name] = (inputRef.element.checked) ? true : false
          break
        case Constants.param.type.select:
          args[inputRef.param.name] = this.getAllSelectedValue(inputRef.element)
          break
        case Constants.param.type.column:
          args[inputRef.param.name] = this.getAllSelectedValue(inputRef.element)
          break
        case Constants.param.type.list:
          break
          
      }
      ParamUtil.clearElement(inputRef.element)
    })
    return args
  }

  static getArgValue (currentTarget: element): any {
    const paramType = currentTarget.dataset['paramtype']
    let value = null
    switch (paramType) {
      case Constants.param.type.number:
        value = (currentTarget.value !== '') ? parseInt(currentTarget.value) : null
        break
      case Constants.param.type.string:
        value = currentTarget.value
        break
      case Constants.param.type.boolean:
        value = (currentTarget.checked) ? true : false
        break
      case Constants.param.type.select:
        value = this.getAllSelectedValue(currentTarget)
        break
      case Constants.param.type.column:
        value = this.getAllSelectedValue(currentTarget)
        break
    }

    return value
  }

  static getAllSelectedValue (element) {
    if (element.multiple) {
      return Array.from(element.selectedOptions).map(v => v.value)
    } else {
      return element.value
    }
  }

  // FIXIT: 
  static getParamElement (param, onBuild, events, defaultValue, refValue, headers) {
    let paramElement
    const {onChange, onUpdate} = events

    switch (param.type) {
      case Constants.param.type.number  :
        paramElement = <ParamNumber param={param} defaultValue={defaultValue} 
                                    onBuild={onBuild} refValue={refValue}
                                    onChange={onChange} />
        break
      case Constants.param.type.string  :
        paramElement = <ParamString label={param.label} param={param} defaultValue={defaultValue}  
                                    onBuild={onBuild} refValue={refValue}
                                    onChange={onChange} />
        break
      case Constants.param.type.boolean :
        paramElement = <ParamBoolean param={param} defaultValue={defaultValue} 
                                     onBuild={onBuild} refValue={refValue}
                                     onChange={onChange} />
        break
      case Constants.param.type.select  :
        paramElement = <ParamSelect param={param} defaultValue={defaultValue} 
                                    onBuild={onBuild} refValue={refValue} 
                                    onChange={onChange} />
        break

      case Constants.param.type.column  :
        //カラム情報を付与
        param.options = {
          labels: headers,
          values: headers,
          multiple: (param.options.multiple) ? true : false
        }
        paramElement = <ParamSelect label={param.label} param={param} defaultValue={defaultValue} 
                                    refValue={refValue} onBuild={onBuild}
                                    onChange={onChange} />
        break

      case Constants.param.type.list    :
        paramElement = <ParamList label={param.label} param={param} arg={defaultValue} onUpdate={onUpdate}></ParamList>
        break

      default:
        paramElement = <ParamString label={param.label} param={param} defaultValue={defaultValue} 
                                    refValue={refValue} onBuild={onBuild}
                                    onChange={onChange} disabled={true} />
        break
    }
    return paramElement
  }
}