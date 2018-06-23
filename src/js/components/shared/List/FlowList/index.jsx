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
  };
  href: string;
  children: React.Node;
}

export default class FlowList extends React.Component<Props>{

  constructor(props){
    super(props)
  }

  render(){
    const {icon,children} = this.props
    const {name,uuid,created_at,creator_name} = this.props.flow

    return <div className={style.flow_list}>
      <i className={classnames("material-icons",[style.icon])}>description</i>
      <div className={style.name}>{name}</div>
      <div className={style.creator_name}>{creator_name}</div>
      <div className={style.created_at}>{created_at}</div>
      <div className={style.action}>{children}</div>
    </div>
  }

}