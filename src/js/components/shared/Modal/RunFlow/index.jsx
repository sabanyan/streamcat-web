//@flow
import React from 'react'
import classnames from 'classnames'
import InputFlowForm from '../../InputFlowForm/index'


export default class RunFlowModal extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {
    const {id, children, close_button, visible, title, footer, contents} = this.props
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
          <InputFlowForm {...this.props.contents}/>
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}