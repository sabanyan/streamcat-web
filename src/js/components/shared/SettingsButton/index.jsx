//@flow
import React from 'react'
import SettingIcon from '../Icon/SettingIcon'
//import classnames from 'classnames'
import style from './style.scss'

type Props = {}

export default class SettingsButton extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  onClick(){
    this.props.addSelectStep("flow")
  }

  render () {
    return <div className={style.settings} onClick={()=>this.onClick()}><SettingIcon/></div>
  }

}