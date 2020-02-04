import * as React from 'react'
import style from './style.scss'

type Props = {
  icon:string
  
  onClick:Function
}

type State = {

}

export default class IconButton extends React.Component<Props, State> {

  render() {
    const { icon, onClick } = this.props

    return <React.Fragment>
      <a className={style.button} onClick={() => onClick()}>
        <i className={'material-icons'} dangerouslySetInnerHTML={{ __html: icon }}></i>
      </a>
    </React.Fragment>
  }
}