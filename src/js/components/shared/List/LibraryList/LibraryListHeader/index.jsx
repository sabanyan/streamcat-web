//@flow
import React from 'react'
import classnames from 'classnames'
import style from '../style.scss'

export default class LibraryListHeader extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {
    return <div className={style.job_list_header}>
      <div className={style.executed_at}>実行日時</div>
      <div className={style.name}>名前</div>
      <div className={style.flow_name}>生成したフロー</div>
      <div className={style.executor_name}>実行ユーザー</div>
      <div className={style.status}>実行状態</div>
    </div>
  }

}