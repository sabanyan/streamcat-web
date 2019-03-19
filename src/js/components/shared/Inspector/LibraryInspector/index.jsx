//@flow
import React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import BaseInspector from '../BaseInspector'
import type { LibraryListDataType } from '../../../../types'
import moment from 'moment/moment'
import Constants from '../../../../constants'
import Button from '../../Button'

type Props = {
  data?: LibraryListDataType;
  onClickDelete: Function;
}

class LibraryInspector extends React.Component<Props> {
  constructor (props:Props) {
    super(props)
  }
  render () {

    const {data} = this.props
    let content = null
    if(data){
      content = <div>
          <div className={"mb-8px"}>
            {data.label}
          </div>
          <div className={style.actions}>
            <Button danger={true}
                    onClick={() => this.props.onClickDelete(data)}>削除する</Button>

          </div>
          <div className={style.full_hr}/>
          <div>
            <label>名称</label>
          </div>
          <div>
            {data.label}
          </div>
          <div>
            <label>作成者</label>
          </div>
          <div>
            {data.creator}
          </div>
          <div>
            <label>作成日時</label>
          </div>
          <div>
            {moment(data.createdAt).format(Constants.format.dateTime)}
          </div>
      </div>
    }

    return <div className={classnames(style.property,style.in)}>
      <BaseInspector {...this.props}>
      {content}
    </BaseInspector>
    </div>
  }

}

export default LibraryInspector