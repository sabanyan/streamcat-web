// @flow
import * as React from 'react'
import style from '../style.scss'
import InOutConnector from './InOutConnector'

type Props = {
  header?: string,
  title?: string,
  children?: React.Node
}

class Inspector extends React.Component<Props> {

  render () {

    const {header, title, children} = this.props

    return <div className={style.property_container}>
      <div className={style.property_header}>
        {header}
      </div>
      <div className={style.property_body}>
        <div className={style.property_title}>
          {title}
        </div>
        <InOutConnector {...this.props}/>
        {children}
      </div>
    </div>
  }

}

export default Inspector