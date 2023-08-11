import { ModalUtil, StringUtil } from 'Utils/index'
import Constants from 'Constants/index'
import React from 'react';
import { ReactDomUtil } from "./index";

export default class ErrorUtil {
  constructor (message: string) {
    throw new Error(message)
  }

  static notifyError(notify:(title:string, message:string) => string, title:string, error){
    notify(title, (error instanceof Error)?ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)):error);
  }

  static getErrorBody (error) {
    let errorBody:React.ReactNode;
    if (error && error.message) {
      errorBody = <div className={'modal-server-error-text'}>
        {error.message}
      </div>
    }else if (error && error.data && error.data['message']) {
      errorBody = <div className={'modal-server-error-text'}>
        {error.data['message']}
      </div>
    } else {
      errorBody = <div className={'modal-server-error-text'}>
        <div>
          <strong>
            {error.request && error.request.statusText}
          </strong>
        </div>
        {error.reques && StringUtil.stripHtmlToText(error.request.responseText)}
      </div>
    }
    return errorBody
  }

}

