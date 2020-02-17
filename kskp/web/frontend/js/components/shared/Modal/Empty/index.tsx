import React from 'react'
import classnames from 'classnames'

/*
 * standard Modalと一緒だが、buttonとcontentの位置が逆転されたモーダル
 * (buttonが上、contentが下)
 */

type Props = {
  id : string
  chldren: React.ReactNode
  close_button: any
  visible: boolean
  title: string
  footer: any
}

export default class EmptyModal extends React.Component<Props> {

  constructor (props) {
    super(props)
  }

  render () {
    const {id, children, close_button, visible, title, footer} = this.props
    const modal_class = classnames('modal fade', {
      'show in': visible,
      'none-pointer-events': !visible,
    })

    return <div className={modal_class} style={{display: 'block'}} id={id}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            {close_button}
          </div>
          <div className="modal-body">
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  }
}