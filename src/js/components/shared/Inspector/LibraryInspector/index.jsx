//@flow
import React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import type { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button } from 'Shared/Input'
import { APIUtil, ModalUtil, SortUtil } from "Utils/index";
import Visualizer from "Shared/Visualizer/Core";

type Props = {
  visualizers: [];
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

  componentWillMount () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.preview.DATASOURCE)
      },
    })
  }

  onClickPreview(e) {
    // dataがない（Null)の場合はPreviwボタンは表示しない（render)
    const {data, visualizers} = this.props

    if (!visualizers) {
      return
    }
    const uuid = data.uuid
    const getFrameHeaderURL = "frames/" + uuid
    APIUtil.get(getFrameHeaderURL + "?header_only=1&offset=0&limit=1").then((response) => {
      const headers = response.data.data
      let sortedVisualizers = visualizers
      sortedVisualizers = SortUtil.getSortedContents(sortedVisualizers)
      let contents = []
      for (const v of sortedVisualizers) {
        const content = <Visualizer key={v.order + uuid} frame_uuid={uuid} visualize={v} params={{}} headers={headers}/>
        contents.push({title: v.label,content:content,parentProps:this.props})
      }

      ModalUtil.emitModal({
        id: Constants.preview.DATASOURCE,
        visible: true,
        contents: contents,
        title: data.label
      })
      this.setState({
        loading: false
      })
    })
  }

  render () {
    const {data, onClickDelete, onClickApply} = this.props
    let content = null
    let label = ""
    let preview = null
    if (data && data.type === Constants.library.type.frame) {
      preview = <Button onClick={(e) => this.onClickPreview(e)} icon={'visibility'}>プレビュー</Button>
    }
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
          <div className={"mb-8px"}>
            {data.label}
          </div>
          <div className={style.actions}>
            {preview}
            {deleteButton}
            {applyButton}
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
      return <div className={classnames(style.property, style.in, 'inspector')}>
        <BaseInspector onBlurTitle={(e) => this.onBlurTitle(e)}>
          {content}
        </BaseInspector>
      </div>
    } else {
      return <Resizer>
        <BaseInspector onBlurTitle={(e) => this.onBlurTitle(e)}>
          {content}
        </BaseInspector>
      </Resizer>
    }

  }

}

export default LibraryInspector