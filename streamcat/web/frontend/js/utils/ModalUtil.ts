//@flow
import { Constants } from 'Constants/index'

type Context ={
  id: string,
  title?: string,
  contents?: any[]
  visible?: boolean,
  dynamic?: boolean,
  danger?: boolean,
  cancel?: string,
  done?: string,
  onClickOK?: Function,
  onClickCancel?: Function,
  onClickDone?: Function,
  onClickClose?: Function,
  content?: JSX.Element,
}

export default class ModalUtil {
  static getUDID () {
    return 'm' + Math.floor(Math.random() * 10000)
  }

  /**
   * モーダル処理の登録
   * @param context
   */
  static registerModal (context: Context) {
    window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_DONE + context.id)
    window.emitter.addListener(Constants.event.MODAL_ON_CLICK_DONE + context.id,
      (result_conext) => {
        if (context.onClickDone) {
          context.onClickDone()
        }
      })
    window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_CANCEL + context.id)
    window.emitter.addListener(Constants.event.MODAL_ON_CLICK_CANCEL +
      context.id, (result_context) => {
      if (context.onClickCancel) {
        context.onClickCancel()
      }
    })
    window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_CLOSE + context.id)
    window.emitter.addListener(Constants.event.MODAL_ON_CLICK_CLOSE +
      context.id, (result_context) => {
      if (context.onClickClose) {
        context.onClickClose()
      }
    })
  }

  /**
   * モーダルの呼び出し
   * @param context
   */
  static emitModal (context: Context) {
    window.emitter.emit(Constants.event.MODAL_EVENT + context.id, context)
  }

  static closeModal (modalId: string) {
    ModalUtil.emitModal({
      id: modalId,
      visible: false
    })
  }
}

