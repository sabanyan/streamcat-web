import React from 'react'
import Constants from '../../../constants/index'
import PropTypes from 'prop-types'
import ModalUtil from '../../../utils/ModalUtil'

export default class Modal extends React.Component {

  constructor (props) {
    super(props)
    this.state = {visible: false,content:null,title: this.props.title}
  }

  componentWillMount () {
    const self = this
    /**
     * モーダルのリスナー処理
     */
    window.emitter.removeListener(Constants.event.MODAL_EVENT + this.props.id)
    window.emitter.addListener(Constants.event.MODAL_EVENT + this.props.id, (context) => {
      if (context.visible !== undefined) {
        self.setState({
          visible: context.visible
        })
      }
      if (context.content !== undefined){
        self.setState({
          content: context.content
        })
      }
      if (context.title !== undefined){
        self.setState({
          title: context.title
        })
      }
    })

  }

  /**
   * OKボタンが押された（props.ok が trueの場合のみ有効）
   */
  onClickOK () {
    window.emitter.emit(Constants.event.MODAL_ON_CLICK_OK + this.props.id, {id: this.props.id})
    this.setState({
      visible: false
    })
  }

  /**
   * 確定ボタンが押された
   */
  onClickDone () {
    window.emitter.emit(Constants.event.MODAL_ON_CLICK_DONE + this.props.id, {id: this.props.id})
  }

  /**
   * キャンセルボタンが押された
   */
  onClickCancel () {
    window.emitter.emit(Constants.event.MODAL_ON_CLICK_CANCEL + this.props.id, {id: this.props.id})
    this.setState({
      visible: false
    })
  }

  /**
   * 背景がクリックされた
   */
  onClickBackdrop(){
    if(!this.props.modal){
      this.setState({visible: false})
    }
  }

  render () {

    const visible = this.state.visible
    const {preview} = this.props

    /**
     * 背景
     */
    const backdrop = (visible) ? <div onClick={() => this.onClickBackdrop()} className={"modal-backdrop fade show" + ((preview) ? " preview" : "")} /> :
      <div className="modal-backdrop fade" style={{pointerEvents: "none"}} />

    let buttons

    /**
     * OKボタン
     */
    if (this.props.ok) {
      buttons = <button type="button" className="btn btn-link" data-dismiss="modal"
                        onClick={() => this.onClickOK()}>
        OK
      </button>
    }

    /**
     * 確定・キャンセルボタン
     */
    if (!this.props.ok) {
      buttons = <div>
        <button type="button" className="btn btn-link" onClick={() => this.onClickCancel()}>
          {this.props.cancel}
        </button>
        &nbsp;
        <button type="button" className="btn btn-link" onClick={() => this.onClickDone()}>{this.props.done}</button>
      </div>
    }

    let close

    /**
     * 閉じるボタン
     */
    if (this.props.close) {
      close =
        <button type="button" className="close" onClick={() => {this.setState({visible: false})}}>
          <span>&times;</span>
        </button>
    }

    if(this.props.preview){
      buttons = null
    }

    let footer
    if(this.props.footer){
      footer = <div className="modal-footer">
          {buttons}
        </div>
    }

    return (
      <div key={this.props.id}>
        <div className={"modal fade" + ((visible) ? " show in" : " none-pointer-events") + ((preview) ? " preview right" : "")} style={{display: "block"}}
             id={this.props.id}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{this.state.title}</h5>
                {close}
              </div>
              <div className="modal-body">
                <div>{(this.props.dynamic)?this.state.content:this.props.children}</div>
              </div>
              {footer}
            </div>
          </div>
        </div>
        {backdrop}
      </div>
    )
  }
}

Modal.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
  done: PropTypes.string,
  cancel: PropTypes.string,
  close: PropTypes.bool,
  ok: PropTypes.bool,
  dynamic: PropTypes.bool,
  preview: PropTypes.bool,
  footer: PropTypes.bool,
  modal: PropTypes.bool
};

Modal.defaultProps = {
  ok: false,
  done: "確定",
  cancel: "キャンセル",
  close: true,
  preview: false,
  footer: true,
  modal: false,
};
