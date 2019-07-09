//@flow
import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  children?: React.Node;
  title: string;
  description: string;
  icon: string
}

export default class EmptyState extends React.Component<Props> {

  constructor (props) {
    super(props)
  }

  render () {
    const {children, title, description, icon} = this.props
    const icon_class: string = classnames('material-icons', [style.icon])
    const icon_container = (icon) ? <div className={style.icon_container}>
      <div className={icon_class}>{icon}</div>
    </div> : null
    return <div className={style.empty_state}>
      {icon_container}
      <div className={style.title}>
        {title}
      </div>
      <div className={style.description}>
        {description}
      </div>
      <div className={style.children}>
        {children}
      </div>
    </div>
  }

}