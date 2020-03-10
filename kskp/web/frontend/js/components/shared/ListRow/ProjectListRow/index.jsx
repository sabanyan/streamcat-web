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
  children: React.Node;
  selected: boolean;
  onClickProject: Function;
  href: string;
}

export default class ProjectListRow extends React.Component<Props> {

  constructor (props) {
    super(props)
  }

  onClick (e: Event) {
    const {project, onClickProject} = this.props
    if (onClickProject) {
      onClickProject(e, project)
    }
  }

  render () {
    const {icon, children, selected, href} = this.props
    const {name, uuid, created_at, creator_name} = this.props.project

    return <div data-cy={"listRow_" + name} className={classnames(style.project, {[style.selected]: selected})} onClick={(e) => this.onClick(e)}>
      <div className={style.project_list}>
        <div className={style.name}>
          <i className={classnames('material-icons', [style.icon])}>description</i>
          <a href={href}>{name}</a>
        </div>
        <div className={style.creator_name}>{creator_name}</div>
        <div className={style.created_at}>{created_at}</div>
        <div className={style.action}>{children}</div>
      </div>
    </div>
  }

}