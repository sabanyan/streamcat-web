//@flow
import React from 'react'
import * as style from './style.scss';
import classnames from 'classnames'

type Props = {
  tab_id: number;
  selected_tab_id: number;
  children: string;
  className?: any;
  activeClassName?: any;
  width: any;
  onClickTab: (e:React.MouseEvent, tab_id:number) => void;
};

export default class Tab extends React.Component<Props> {
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