//@flow
import React from 'react'
import classnames from 'classnames'
import TabBar from '../../TabBar'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'
import TabPanel from '../../TabBar/TabPanel'

export default class PreviewModal extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {

    const {id, children, close_button, visible, title, footer} = this.props
    const modal_class = classnames('modal fade preview top', {
      'show in': visible,
      'none-pointer-events': !visible,
    })

    return <div className={modal_class} style={{display: 'block'}} id={id}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">
              <span>{title}</span>
              {/*<TabBar>*/}
                {/*<TabList>*/}
                  {/*<Tab>フローエディター</Tab>*/}
                  {/*<Tab>結果</Tab>*/}
                  {/*<Tab>結果</Tab>*/}
                {/*</TabList>*/}
                {/*<TabPanel>*/}
                {/*</TabPanel>*/}
                {/*<TabPanel>*/}
                {/*</TabPanel>*/}
              {/*</TabBar>*/}
            </div>

            {close_button}
          </div>
          <div className="modal-body">
            <div>{children}</div>
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}