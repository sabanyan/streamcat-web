//@flow
import ModalUtil from './ModalUtil'
import Constants from '../constants'
import StringUtil from './StringUtil'
import React from 'react'

export default class ErrorUtil {
  constructor (message:string):Error {
    throw new Error(message)
  }

  static showError(target,error){
    let errorBody
    if(error.data["message"]){
      errorBody = <div className={"modal-error-text"}>
        {error.data["message"]}
      </div>
    }else{
      errorBody = <div className={"modal-error-text"}><div>
        <strong>
          {error.request.statusText}
        </strong>
      </div>
        {StringUtil.stripHtmlToText(error.request.responseText)}
      </div>
    }

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

