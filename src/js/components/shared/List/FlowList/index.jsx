//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowListDataType } from 'Types/index'
import Constants from 'Constants/index'
import moment from 'moment/moment'

type Props = {
  icon?: string;
  flow: FlowListDataType;
  href?: string;
  children: React.Node;
  selected: boolean;
  onClickFlow: Function;
}

export default class FlowList extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  onClick (e: Event) {
    const {flow, onClickFlow} = this.props
    if (onClickFlow) {
      onClickFlow(e, flow)
    }
  }

  render () {
    const {icon, children, href, selected} = this.props
    const flow: FlowListDataType = this.props.flow

    return <div className={classnames(style.flow, {[style.selected]: selected})} onClick={(e) => this.onClick(e)}>
      <div className={style.flow_list}>
        <div className={style.name}>
          <i className={classnames('material-icons', [style.icon])}>description</i>
          <a href={href}>
            {flow.label}
          </a>
        </div>
        <div className={style.creator_name}>{flow.creator}</div>
        <div className={style.created_at}>{moment(flow.createdAt).format(Constants.format.dateTime)}</div>
        <div className={style.action}>{children}</div>
      </div>
    </div>
  }

}