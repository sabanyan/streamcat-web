import React from 'react'
import style from './style.scss'

export default class GroupListHeader extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {
    return <div className={style.groupListHeader}> 
      <div className={style.name}>名前</div>
      <div className={style.creatorName}>作成者</div>
      <div className={style.createdAt}>作成日時</div>
      <div className={style.action}></div>
    </div>
  }

}