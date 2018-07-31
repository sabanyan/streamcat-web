// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  center: boolean;
  absolute?: boolean;
  fixed?: boolean;
  visible?: boolean;
  message?: string;
  whiteBackground?: boolean;
  blackBackground?: boolean;
}

export default class Loader extends React.Component<Props> {

  static defaultProps = {
    center: true,
    absolute: true,
    fixed: false,
    visible: false,
    message: "",
    whiteBackground: false,
    blackBackground: false,
  }

  constructor (props:Props) {
    super(props)
  }

  render () {

    const {center, absolute, fixed, visible, message,whiteBackground,blackBackground} = this.props

    const loader_class = classnames({
      [style.center]: center,
      [style.absolute]: absolute,
      [style.fixed]: fixed,
      [style.hidden]: !visible,
      [style.offsetY]: (message),
      [style.white_text]: blackBackground,
      [style.black_text]: whiteBackground
  })

    const bg_class = classnames({
      [style.white_background]: whiteBackground,
      [style.black_background]: blackBackground,
      [style.hidden]: !visible,
     })

    return <div>
      <div className={loader_class}><div className={style.loader}>
      </div>
      <div className={style.message}>
        {message}
      </div>
      </div>
      <div className={bg_class}></div>
    </div>
  }

}