// @flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowListDataType } from '../../../../types'
import Constants from '../../../../constants'
import moment from 'moment/moment'

type Props = {
  icon?: string;
  flow: FlowListDataType;
  href?: string;
  children: React.Node;
}

export default class FlowList extends React.Component<Props> {

  constructor (props:Props) {
    super(props)
  }

  render () {
    const {icon, children, href} = this.props
    const flow:FlowListDataType = this.props.flow

    return <a className={style.flow} href={href}>
      <div className={style.flow_list}>
        <div className={style.name}>
          <i className={classnames('material-icons', [style.icon])}>description</i>{flow.label}
        </div>
      <div className={style.creator_name}>{flow.creator}</div>
      <div className={style.created_at}>{moment(flow.createdAt).format(Constants.format.dateTime)}</div>
      <div className={style.action}>{children}</div>
    </div>
    </a>
  }

}