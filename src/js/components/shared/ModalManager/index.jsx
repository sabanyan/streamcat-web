// @flow
import React from 'react'
import Constants from '../../../constants/index'
import Modal from '../Modal'

/**
 *
 * 全てのモーダルはここで管理します
 *
 * モーダルの呼び出し位置でモーダルを表示した場合、
 * 不具合が生じやすいため分離した構成になっています
 *
 * モーダルとコンポーネント間はEventEmitterで通信できるようになっています
 *
 * モーダルウインドウを表示する場合
 *
 * Modal <---- EventEmitter ----> Component
 * Listen                          emit!!
 *
 * モーダルウインドウ内のボタンが押された場合
 *
 * Modal <----- EventEmitter ----> Component
 * emit!!                           listen
 *
 * ボタンが押された場合の処理は、ModalUtil.registerで
 * コールバック処理を受け取れます
 *
 */

export default class ModalManager extends React.Component {
  constructor (props: Props) {
    super(props)
  }

  componentDidUpdate () {
    window.modalRefs = this.refs
  }

  render () {

    return <div>
      <Modal key={Constants.modal.ADD_OPERATOR}
             id={Constants.modal.ADD_OPERATOR} dynamic={true}>
      </Modal>
      <Modal key={Constants.modal.IMPORT_DATASOURCE}
             id={Constants.modal.IMPORT_DATASOURCE} dynamic={true}
             done={'追加する'}>
      </Modal>
      <Modal key={Constants.preview.DATASOURCE}
             id={Constants.preview.DATASOURCE} title="プレビュー" dynamic={true}
             preview={true} footer={false}>
      </Modal>
      <Modal key={Constants.modal.SHOW_MESSAGE}
             id={Constants.modal.SHOW_MESSAGE} title="" dynamic={true}
             ok={true}>
        <div ref={Constants.modal.property.SHOW_MESSAGE}/>
      </Modal>
      <Modal key={Constants.modal.ADD_PROJECT} id={Constants.modal.ADD_PROJECT}
             title="新しいプロジェクトを始める" dynamic={true} done={'作成する'}>
      </Modal>
      <Modal key={Constants.modal.ADD_FLOW} id={Constants.modal.ADD_FLOW}
             title="新しいフローを始める" dynamic={true} done={'作成する'}>
      </Modal>
    </div>
  }
}
