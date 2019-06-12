//@flow
import React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import BaseInspector from 'Shared/Inspector/BaseInspector'
import type { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import Button from 'Shared/Button'
import Resizer from 'Shared/Inspector/Resizer'

type Props = {
  data?: LibraryListDataType;
  onClickDelete?: Function;
  onClickApply?: Function;
  onBlurTitle?: Function;
}

class LibraryInspector extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
  }

  onBlurTitle (e: SyntheticInputEvent<EventTarget>) {
    if (this.props.onBlurTitle) {
      this.props.onBlurTitle(e)
    }
  }

  render () {
    const {data, onClickDelete, onClickApply} = this.props
    let content = null
    let label = ''

    let deleteButton
    if (onClickDelete) {
      deleteButton = <Button danger={true}
                             onClick={() => onClickDelete(data)}>削除する</Button>
    }
    let applyButton
    if (onClickApply) {
      applyButton = <Button primary={true}
                            onClick={() => onClickApply(data)}>選択する</Button>
    }

    if (data) {
      label = data.label
      content = <div>
        <div className={'mb-8px'}>
          {data.label}
        </div>
        <div className={style.actions}>
          {deleteButton}
          {applyButton}
        </div>
        <div className={style.full_hr} />
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
      return <div className={classnames(style.property, style.in, 'inspector')}>
        <BaseInspector {...this.props} onBlurTitle={(e) => this.onBlurTitle(e)}>
          {content}
        </BaseInspector>
      </div>
    } else {
      return <Resizer>
        <BaseInspector {...this.props} onBlurTitle={(e) => this.onBlurTitle(e)}>
          {content}
        </BaseInspector>
      </Resizer>
    }

  }

}

export default LibraryInspector