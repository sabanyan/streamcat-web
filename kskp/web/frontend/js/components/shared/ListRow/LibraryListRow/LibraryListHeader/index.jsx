//@flow
import React from 'react'
import style from '../style.scss'

type Props = {}

export default class LibraryListHeader extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  render () {
    return <div className={style.job_list_header}>
      <div className={style.name}>名前</div>
      <div className={style.executor_name}>作成者</div>
      <div className={style.executed_at}>作成日時</div>
    </div>
  }

}