import React from 'react'
import style from './style.css'

export default class TabPanel extends React.Component {
  render () {
    const active = (this.props.selected_tab_id === this.props.tab_id)
    const children = (active) ? this.props.children : null
    return <div className={'d-flex align-items-stretch'}>
      {children}
    </div>
  }
}
