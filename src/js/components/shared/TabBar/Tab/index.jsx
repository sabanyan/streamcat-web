import React from 'react'
import style from './style.scss'
import classnames from 'classnames'

export default class Tab extends React.Component {
  onClickTab () {
    this.props.selectTab(this.props.tab_id)
  }

  render () {
    const active = (this.props.tab_id === this.props.selected_tab_id)
    const tabClass = classnames(
      style.tab, {
        [style.active]: active,
      },
    )
    return <div className={tabClass} onClick={() => this.onClickTab()}>
      {this.props.children}
    </div>
  }
}