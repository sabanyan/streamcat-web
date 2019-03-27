//@flow
import Constants from '../constants'

export default class ModalUtil {
  static getUDID () {
    return 'm' + Math.floor(Math.random() * 10000)
  }

  /**
   * モーダル処理の登録
   * @param context
   */
  static registerModal (context:{}) {
    window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_DONE +
      context.id)
    window.emitter.addListener(Constants.event.MODAL_ON_CLICK_DONE + context.id,
      (result_context) => {
        if (context.onClickDone) {
          context.onClickDone()
        }
      })
    window.emitter.removeAllListeners(Constants.event.MODAL_ON_CLICK_CANCEL +
      context.id)
    window.emitter.addListener(Constants.event.MODAL_ON_CLICK_CANCEL +
      context.id, (result_context) => {
      if (context.onClickCancel) {
        context.onClickCancel()
      }
    })
  }

  /**
   * モーダルの呼び出し
   * @param context
   */
  static emitModal (context:{}) {
    window.emitter.emit(Constants.event.MODAL_EVENT + context.id, context)
  }

  static closeModal (modalId:string) {
    ModalUtil.emitModal({id: modalId, visible: false})
  }

  static getContentsFrom(frame_uuid, visualizers, params, headers, parentProps) : [] {
    let sortedVisualizers = visualizers.sort((a, b) => {
      // ある順序の基準において a が b より小
      if (a.order < b.order) {
        return -1;
      }
      //その順序の基準において a が b より大
      if (a.order > b.order) {
        return 1;
      }
      // a は b と等しいはず
      return 0;
    })

    let contents = []
    for (const v of sortedVisualizers) {
      const content = {frame_uuid:frame_uuid, visualize:v, params:params, headers:headers}
      contents.push({title: v.label,content:content,parentProps:parentProps})
    }

    return contents
  }
}

