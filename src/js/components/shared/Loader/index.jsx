// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  center: boolean;
  absolute: boolean;
  fixed: boolean;
  visible: boolean;
}

export default class Loader extends React.Component<Props> {

  static defaultProps = {
    center: true,
    absolute: true,
    fixed: false,
    visible: false,
  }

  constructor (props:Props) {
    super(props)
  }

  render () {

    const {center, absolute, fixed, visible} = this.props

    const loader_class = classnames([style.loader], {
      [style.center]: center,
      [style.absolute]: absolute,
      [style.fixed]: fixed,
      [style.hidden]: !visible,
    })

    return <div className={loader_class}>
    </div>
  }

}