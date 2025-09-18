//@flow
import React, {JSX} from 'react'
import classnames from 'classnames'

type Props = {
  id: string;
  title: string;
  close_button: JSX.Element;
  footer: JSX.Element;
  overflow: boolean;
  visible: boolean;
  children: any;
};

export default class StandardModal extends React.Component<Props> {

  constructor (props) {
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