//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import { LibraryListDataType } from 'Types/index'
import Constants from 'Constants/index'
import moment from 'moment/moment'

type Props = {
  icon?: string;
  libraryChild: LibraryListDataType;
  href?: string;
  children?: React.Node;
  selected: boolean;
  onClick: Function;
}

export default class LibraryList extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  onClick (e: Event) {
    const {libraryChild, onClick} = this.props
    if (onClick) {
      onClick(e, libraryChild)
    }
  }

  renderLibraryListIcon (type: string) {
    const database = <svg className={style.databaseIcon} width="15px" height="17px" viewBox="0 0 15 17" version="1.1">
      <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Desktop" transform="translate(-86.000000, -3515.000000)">
          <g id="Group-7" transform="translate(87.000000, 3515.000000)">
            <rect id="Rectangle" fill="#616C7B" x="0" y="0" width="13" height="17" rx="4" />
            <path
              d="M-1.14575016e-13,7 C-1.14575016e-13,7.87404064 2.22903552,8.31106096 6.68710657,8.31106096 C11.1451776,8.31106096 13.3742131,7.87404064 13.3742131,7"
              id="Path" stroke="#FFFFFF" />
            <path
              d="M-1.14575016e-13,11 C-1.14575016e-13,11.8740406 2.22903552,12.311061 6.68710657,12.311061 C11.1451776,12.311061 13.3742131,11.8740406 13.3742131,11"
              id="Path" stroke="#FFFFFF" />
            <ellipse id="Oval" fill="#FFFFFF" cx="6.5" cy="2.5" rx="4.5" ry="1.5" />
          </g>
        </g>
      </g>
    </svg>

    switch (type) {
      case Constants.library.type.document:
        return <i className={classnames('material-icons',
          [style.icon])}>description</i>
      case Constants.library.type.frame:
        return <i className={classnames('material-icons',
          [style.icon])}>description</i>
      case Constants.library.type.folder:
        return <i className={classnames('material-icons',
          [style.icon])}>folder</i>
      case Constants.library.type.database:
        return database
      case Constants.library.type.remoteFolder:
        return <i className={classnames('material-icons',
          [style.icon])}>dns</i>
    }
    return null
  }

  canUseHref (libraryChild) {
    return (libraryChild.type === Constants.library.type.folder)
  }

  render () {
    const {icon, children, href, selected} = this.props
    const libraryChild: LibraryListDataType = this.props.libraryChild

    let label = <span>{libraryChild.label}</span>
    if (this.canUseHref(libraryChild)) {
      label = <a href={href}>
        {libraryChild.label}
      </a>
    }

    return <div className={classnames(style.library, {[style.selected]: selected})}
                onClick={(e) => this.onClick(e)}>
      <div className={style.library_list}>
        <div className={style.name}>
          {this.renderLibraryListIcon(libraryChild.type)}
          {label}
        </div>
        <div className={style.creator_name}>{libraryChild.creator}</div>
        <div className={style.created_at}>{moment(libraryChild.createdAt).format(Constants.format.dateTime)}</div>
        <div className={style.action}>{children}</div>
      </div>
    </div>
  }

}