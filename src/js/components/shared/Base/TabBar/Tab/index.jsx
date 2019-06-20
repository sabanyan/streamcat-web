//@flow
import React from 'react'
import style from './style.scss'
import classnames from 'classnames'

export default class Tab extends React.Component {
  onClickTab (e) {
    this.props.onClickTab(e, this.props.tab_id)
  }

  render () {
    const active = (this.props.tab_id === this.props.selected_tab_id)
    const tabClass = classnames(
      style.tab, {
        [style.active]: active,
        [this.props.activeClassName]: (this.props.activeClassName && active)
      }, {
        [this.props.className]: (this.props.className)
      },
    )
    return <div className={tabClass} onClick={(e) => this.onClickTab(e)} style={{width: this.props.width}}>
      {this.props.children}
    </div>
  }
}