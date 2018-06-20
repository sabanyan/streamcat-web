// @flow
import React from 'react'
import classnames from 'classnames';
import style from './style.scss'

type Props ={
  icon: string;
  flow:{
    created_at:string;
    creator_name:string;
    name:string;
    uuid:string;
  }
}

export default class FlowList extends React.Component<Props>{

  constructor(props){
    super(props)
  }

  render(){
    const {icon} = this.props
    const {name,uuid,created_at,creator_name} = this.props.project

    return <div className={style.flow_list}>
      <i className={classnames("material-icons",[style.icon])}>description</i>
      <div className={style.name}>{name}</div>
      <div className={style.creator_name}>{creator_name}</div>
      <div className={style.created_at}>{created_at}</div>
      <div className={style.action}>action</div>
    </div>
  }

}