//@flow
import Constants from 'Constants/index'
import { ParamBoolean, ParamNumber, ParamSelect, ParamString } from 'Shared/Inspector'
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
      }
      ParamUtil.clearElement(inputRef.element)
    })
    return args
  }

  static getArgValue (currentTarget: element): any {
    const paramType = currentTarget.getAttribute('paramtype')
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
  static getParamElement (param, onBuild, events, defaultValue, refValue, headers, noLabel?) {

    let paramElement
    switch (param.type) {
      case Constants.param.type.number:
        paramElement = <ParamNumber param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}
                                    events={events} noLabel={noLabel}/>
        break
      case Constants.param.type.string:
        paramElement = <ParamString param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}
                                    events={events} noLabel={noLabel}/>
        break
      case Constants.param.type.boolean:
        paramElement = <ParamBoolean param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}
                                     events={events} noLabel={noLabel}/>
        break
      case Constants.param.type.select:
        paramElement = <ParamSelect param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}
                                    events={events}  noLabel={noLabel}/>
        break

      case Constants.param.type.column:
        //カラム情報を付与
        param.options = {
          labels: headers,
          values: headers,
          multiple: (param.options.multiple) ? true : false
        }
        paramElement = <ParamSelect param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild}
                                    events={events}  noLabel={noLabel} />
        break

      default:
        paramElement =
          <ParamString param={param} defaultValue={defaultValue} refValue={refValue} onBuild={onBuild} events={events}
                       disabled={true}  noLabel={noLabel}/>
        break
    }
    return paramElement
  }
}