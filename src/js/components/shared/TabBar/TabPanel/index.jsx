//@flow
import React from 'react'
import style from './style.scss'

export default class TabPanel extends React.Component {
  render () {
    const active = (this.props.selected_tab_id === this.props.tab_id)
    const children = (active) ? this.props.children : null
    return <div class={style.tabpanel}>
      {children}
    </div>
  }
}
