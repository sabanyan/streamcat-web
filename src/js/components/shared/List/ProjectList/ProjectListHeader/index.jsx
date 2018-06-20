// @flow
import React from 'react'
import classnames from 'classnames';
import style from './style.scss'

export default class ProjectListHeader extends React.Component{

  constructor(props){
    super(props)
  }

  render(){
    return <div className={style.project_list_header}>
      <div className={style.name}>名前</div>
      <div className={style.creator_name}>作成者</div>
      <div className={style.created_at}>作成日時</div>
      <div className={style.action}></div>
    </div>
  }

}