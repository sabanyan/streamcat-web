//@flow
import React from 'react'
import * as style from './style.scss';

type Props = {
  tab_id: number;
  selected_tab_id: number;
  children: string;
};

export default class TabPanel extends React.Component<Props> {
  render () {
    const active = (this.props.selected_tab_id === this.props.tab_id)
    const children = (active) ? this.props.children : null
    return <div className={style.tabpanel}>
      {children}
    </div>
  }
}
