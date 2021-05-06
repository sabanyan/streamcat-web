//@flow
import React from 'react'
import style from './style.scss'
import classnames from 'classnames'

export type Props = {
  tab_id:string;
  selected_tab_id:string;
  activeClassName?:string;
  className?:string;
  width:string;
  onClickTab:Function;
}
export default class Tab extends React.Component<Props> {
  onClickTab (e) {
    this.props.onClickTab(e, this.props.tab_id)
  }

  render () {
    const active = (String(this.props.tab_id) === this.props.selected_tab_id)
    let activeClassName = this.props.activeClassName ? this.props.activeClassName : "";
    let className = this.props.className ? this.props.className : "";
    const tabClass = classnames(
      style.tab, {
        [style.active]: active,
        [activeClassName]: (activeClassName && active)
      }, {
        [className]: (className)
      },
    )
    return <div className={tabClass} onClick={(e) => this.onClickTab(e)} style={{width: this.props.width}}>
      {this.props.children}
    </div>
  }
}