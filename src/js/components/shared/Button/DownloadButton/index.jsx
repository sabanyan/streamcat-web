//@flow
import * as React from 'react'
import style from '../style.scss'
import classnames from 'classnames'

export default class DownloadButton extends React.Component<DownloadButtonType> {
  render () {
    const {onClick, children, disabled, icon, danger, href, download} = this.props
    const icon_class = classnames('material-icons', [style.icon])
    const material_icon = (icon)
      ? <i className={icon_class} dangerouslySetInnerHTML={{__html: icon}}></i>
      : null
    return <a download={download} href={href}
              className={classnames(style.button, {[style.danger]: danger})}
              disabled={disabled} onClick={onClick}>
      {material_icon}
      <div className={style.text}>
        {children}
      </div>
    </a>
  }
}