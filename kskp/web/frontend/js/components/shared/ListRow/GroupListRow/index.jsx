import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  icon: string;
  group: {
    createdAt: string;
    creatorName: string;
    name: string;
    uuid: string;
  };
  children: React.Node;
  selected: boolean;
  onClickGroup: Function;
  href: string;
}

export default class GroupListRow extends React.Component<Props> {

  constructor (props) {
    super(props)
  }

  onClick (e: Event) {
    const {group, onClickGroup} = this.props
    if (onClickGroup) {
      onClickGroup(e, group)
    }
  }

  render () {
    const {icon, children, selected, href} = this.props
    const {name, uuid, createdAt, creatorName} = this.props.group

    return <div className={classnames(style.group, {[style.selected]: selected})} onClick={(e) => this.onClick(e)}>
      <div className={style.groupList}>
        <div className={style.name}>
          <i className={classnames('material-icons', [style.icon])}>description</i>
          <a href={href}>{name}</a>
        </div>
        <div className={style.creatorName}>{creatorName}</div>
        <div className={style.createdAt}>{createdAt}</div>
        <div className={style.action}>{children}</div>
      </div>
    </div>
  }

}