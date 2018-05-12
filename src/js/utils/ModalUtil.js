import Constants from '../constants'

export default class ModalUtil {
    static getUDID() {
        return "m" + Math.floor(Math.random() * 10000)
    }

    /**
     * モーダル処理の登録
     * @param context
     */
    static registerModal(context) {
        window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_DONE + context.id)
        window.emitter.addListener(Constants.event.MODAL_ON_CLICK_DONE + context.id, (result_context) => {
            if (context.onClickDone) {
                context.onClickDone()
            }
        })
        window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_CANCEL + context.id)
        window.emitter.addListener(Constants.event.MODAL_ON_CLICK_CANCEL + context.id, (result_context) => {
            if (context.onClickCancel) {
                context.onClickCancel()
            }
        })
    }

    /**
     * モーダルの呼び出し
     * @param context
     */
    static emitModal(context) {
        window.emitter.emit(Constants.event.MODAL_EVENT + context.id, context)
    }
}

