//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  icon: string;
  project: {
    created_at: string;
    creator_name: string;
    name: string;
    uuid: string;
  };
  href: string;
  children: React.Node;
}

export default class ProjectList extends React.Component<Props> {

  constructor (props) {
    super(props)
  }

  render () {
    const {icon, href, children} = this.props
    const {name, uuid, created_at, creator_name} = this.props.project

    return <a className={style.project}  href={href}><div className={style.project_list}>
      <div className={style.name}>
      <i className={classnames('material-icons', [style.icon])}>description</i>
      {name}
      </div>
      <div className={style.creator_name}>{creator_name}</div>
      <div className={style.created_at}>{created_at}</div>
      <div className={style.action}>{children}</div>
    </div>
    </a>
  }

}