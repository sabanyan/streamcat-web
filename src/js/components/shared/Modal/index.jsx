// @flow
import * as React from 'react'
import Constants from '../../../constants/index'
import StandardModal from './Standard'
import PreviewModal from './Preview'
import Button from '../Button'

type Props = {
  id: string,
  title?: string,
  content?: React.Node,
  dynamic?: boolean,
  preview?: boolean,
  footer?: boolean,
  modal?: boolean,
  ok?: boolean,
  cancel?: string,
  close?: boolean,
  done?: string,
  children?: React.Node
}

type State = {
  visible: boolean,
  content?: any,
  title?: string
}

export default class Modal extends React.Component<Props, State> {
  static defaultProps = {
    ok: false,
    done: '確定',
    cancel: 'キャンセル',
    close: true,
    preview: false,
    footer: true,
    modal: false,
  }

  constructor (props: Props) {
    super(props)
    this.state = {visible: false, content: null, title: this.props.title}
  }

  componentWillMount () {
    const self = this
    /**
     * モーダルのリスナー処理
     */
    window.emitter.removeListener(Constants.event.MODAL_EVENT + this.props.id)
    window.emitter.addListener(Constants.event.MODAL_EVENT + this.props.id,
      (context) => {
        if (context.visible !== undefined) {
          self.setState({
            visible: context.visible,
          })
        }
        if (context.content !== undefined) {
          self.setState({
            content: context.content,
          })
        }
        if (context.title !== undefined) {
          self.setState({
            title: context.title,
          })
        }
      })

  }

  /**
   * OKボタンが押された（props.ok が trueの場合のみ有効）
   */
  onClickOK () {
    window.emitter.emit(Constants.event.MODAL_ON_CLICK_OK + this.props.id,
      {id: this.props.id})
    this.setState({
      visible: false,
    })
  }

  /**
   * 確定ボタンが押された
   */
  onClickDone () {
    window.emitter.emit(Constants.event.MODAL_ON_CLICK_DONE + this.props.id,
      {id: this.props.id})
  }

  /**
   * キャンセルボタンが押された
   */
  onClickCancel () {
    window.emitter.emit(Constants.event.MODAL_ON_CLICK_CANCEL + this.props.id,
      {id: this.props.id})
    this.setState({
      visible: false,
    })
  }

  /**
   * 背景がクリックされた
   */
  onClickBackdrop () {
    if (!this.props.modal) {
      this.setState({visible: false})
    }
  }

  render () {

    const {visible, title, content} = this.state
    const {preview, ok, close, footer, done, cancel, children} = this.props

    /**
     * 背景
     */
    const backdrop = (visible) ? <div onClick={() => this.onClickBackdrop()}
                                      className={'modal-backdrop fade show' +
                                      ((preview) ? ' preview' : '')}/> :
      <div className="modal-backdrop fade" style={{pointerEvents: 'none'}}/>

    let buttons

    /**
     * OKボタン
     */
    if (ok) {
      buttons = <Button data-dismiss="modal"
                        onClick={() => this.onClickOK()}>
        OK
      </Button>
    }

    /**
     * 確定・キャンセルボタン
     */
    if (!ok) {
      buttons = <div>
        <Button
          onClick={() => this.onClickCancel()}>
          {cancel}
        </Button>
        &nbsp;
        <Button
          onClick={() => this.onClickDone()}>
          {done}
        </Button>
      </div>
    }

    /**
     * 閉じるボタン
     */
    let close_button
    if (close) {
      close_button =
        <button type="button" className="close" onClick={() => {
          this.setState({visible: false})
        }}>
          <span>&times;</span>
        </button>
    }

    if (preview) {
      buttons = null
    }

    let modal_footer
    if (footer) {
      modal_footer = <div className="modal-footer">
        {buttons}
      </div>
    }

    const {id, dynamic} = this.props

    let modal
    let modal_body = (dynamic) ? content : children
    if (preview) {
      modal = <PreviewModal id={id} title={title} footer={modal_footer}
                            close_button={close_button} visible={visible}>
        {modal_body}
      </PreviewModal>
    }
    else {
      modal = <StandardModal id={id} title={title} footer={modal_footer}
                             close_button={close_button} visible={visible}>
        {modal_body}
      </StandardModal>
    }

    return <div>
      {modal}
      {backdrop}
    </div>
  }
}