// @flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import type { FlowListDataType } from '../../../../types'

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

    return <a className={style.flow} href={href}><div className={style.flow_list}>
      <i className={classnames('material-icons', [style.icon])}>description</i>
      <div className={style.name}>{flow.label}</div>
      <div className={style.creator_name}>-</div>
      <div className={style.created_at}>-</div>
      <div className={style.action}>{children}</div>
    </div>
    </a>
  }

}