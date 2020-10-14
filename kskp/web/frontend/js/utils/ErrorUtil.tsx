import { ModalUtil, StringUtil } from 'Utils/index'
import Constants from 'Constants/index'
import * as React from "react";
import { ReactDomUtil } from "./index";

export default class ErrorUtil {
  constructor (message: string) {
    throw new Error(message)
  }

  static notifyError(notify,title,error){
    notify({
      title: title,
      message: (error instanceof Error)?ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)):error,
      status: 'error',
      dismissAfter: 0,
      closeButton: true
    })
  }

  static getErrorBody (error) {
    let errorBody:React.ReactNode;
    if (error && error.data && error.data['message']) {
      errorBody = <div className={'modal-server-error-text'}>
        {error.data['message']}
      </div>
    } else {
      errorBody = <div className={'modal-server-error-text'}>
        <div>
          <strong>
            {error.request.statusText}
          </strong>
        </div>
        {StringUtil.stripHtmlToText(error.request.responseText)}
      </div>
    }
    return errorBody
  }

  static showError (target, error) {
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
    if (target['loading'] !== undefined) target.loading = false
    target.forceUpdate()
  }
}

