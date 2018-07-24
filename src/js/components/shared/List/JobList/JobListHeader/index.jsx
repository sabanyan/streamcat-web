// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'

export default class JobListHeader extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {
    return <div className={style.job_list_header}>
      <div className={style.name}>名前</div>
      <div className={style.creator_name}>実行ユーザー</div>
      <div className={style.created_at}>実行日時</div>
      <div className={style.action}></div>
    </div>
  }

}