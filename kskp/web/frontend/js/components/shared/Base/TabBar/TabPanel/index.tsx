//@flow
import React from 'react'
import style from './style.scss'

export type Props = {
  tab_id:string
  selected_tab_id:string
}

export default class TabPanel extends React.Component<Props> {
  render () {
    const active = (this.props.selected_tab_id === this.props.tab_id)
    const children = (active) ? this.props.children : null
    return <div className={style.tabpanel}>
      {children}
    </div>
  }
}
