//@flow
import React from 'react'
import classnames from 'classnames'

export type Props = {
  id:any
  close_button:any 
  visible:any 
  title:any 
  footer:any 
  overflow:any
}

export default class StandardModal extends React.Component<Props> {

  constructor (props:Props) {
    super(props)
  }

  render () {
    const {id, children, close_button, visible, title, footer, overflow} = this.props
    const modal_class = classnames('modal fade', {
      'show in': visible,
      'none-pointer-events': !visible,
      'overflow-content': overflow || true
    })
    return <div className={modal_class} style={{display: 'block'}} id={id}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            {close_button}
          </div>
          <div className="modal-body" style={{overflow: (overflow)?"scroll":"inherit"}}>
            <div>{children}</div>
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}