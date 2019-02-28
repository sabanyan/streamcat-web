//@flow
import ModalUtil from './ModalUtil'
import Constants from '../constants'
import StringUtil from './StringUtil'
import React from 'react'

export default class ErrorUtil {
  constructor (message:string):Error {
    throw new Error(message)
  }
  static getErrorBody(error){
    let errorBody
    if(error.data["message"]){
      errorBody = <div className={"modal-server-error-text"}>
        {error.data["message"]}
      </div>
    }else{
      errorBody = <div className={"modal-server-error-text"}><div>
        <strong>
          {error.request.statusText}
        </strong>
      </div>
        {StringUtil.stripHtmlToText(error.request.responseText)}
      </div>
    }
    return errorBody
  }

  static showError(target,error){
    const errorBody = ErrorUtil.getErrorBody(error)
    const content = <div>
      <div>フローの実行中にエラーが発生しました。</div>
      {errorBody}
    </div>
    ModalUtil.registerModal({
      id: Constants.modal.SHOW_RUN_ERROR
    })
    ModalUtil.emitModal({
      id: Constants.modal.SHOW_RUN_ERROR,
      visible: true,
      content: content
    })
    if(target["loading"] !== undefined)target.loading  = false
    target.forceUpdate()
  }
}

