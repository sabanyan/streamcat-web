//@flow
import React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import type { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button, DownloadButton } from 'Shared/Input'
import { APIUtil, ModalUtil, SortUtil, HttpUtil, ErrorUtil, ReactDomUtil } from "Utils/index";
import Visualizer from "Shared/Visualizer/Core";
import { API } from 'Modules/api/index'

type Props = {
  visualizers: [];
  data?: LibraryListDataType;
  onClickDelete?: Function;
  onClickApply?: Function;
  onClickMove?: Function;
  onBlurTitle?: Function;
  onClickEditEncoding?: Function;
}

class LibraryInspector extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  onBlurTitle(e: SyntheticInputEvent<EventTarget>) {
    if (this.props.onBlurTitle) {
      this.props.onBlurTitle(e)
    }
  }

  componentWillMount() {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.preview.DATASOURCE)
      },
    })
  }

  onClickPreview(e) {
    // dataがない（Null)の場合はPreviewボタンは表示しない（render)
    let { data, visualizers } = this.props
    visualizers = SortUtil.getSortedContents(visualizers)

    let id = data.uuid

    try {
      if (!visualizers) "visualizers are not defined"
      // vizs
      this.setState({
        loading: true
      }, () => {
        let contents = []
        for (const v of visualizers) {
          let content = { frame_uuid: data.uuid, visualize: v }
          contents.push({ title: v.label, content: content, parentProps: this.props, id: id })
        }

        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          contents: contents,
          title: data.label
        })
      })
    } catch (e) {
      console.log(e)
    }
  }

  onClickEdit(e) {
    const { data, onClickEdit } = this.props
    onClickEdit(data)
  }

  renderButtons() {
    const { data, onClickDelete, onClickApply, onClickMove, onClickEdit, onClickEditEncoding } = this.props

    let preview, download, del, apply, move, edit, editEncoding

    // preview button
    // download button
    if (data && data.label && data.type === Constants.library.type.frame) {
      preview = <Button onClick={(e) => this.onClickPreview(e)} icon={'visibility'}>プレビュー</Button>
      const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + data.uuid + "&ext=csv&label=" + data.label
      download = <DownloadButton href={href} icon={'get_app'}>CSVダウンロード</DownloadButton>
    }

    // move button
    if (onClickMove) move = <Button onClick={(data) => onClickMove(data)} icon={'arrow_right_alt'}>移動する</Button>

    // edit
    if (onClickEdit && data && data.type === Constants.library.type.database) {
      edit = <Button onClick={(e) => this.onClickEdit(e)} icon={'create'}>編集する</Button>
    }

    // delete button
    if (onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)}>削除する</Button>

    // apply button
    if (onClickApply) apply = <Button primary={true} onClick={() => onClickApply(data)}>選択する</Button>

    // editEncoding
    if (onClickEditEncoding) editEncoding =  <Button onClick={() => onClickEditEncoding(data)} icon={'edit'}>文字コード編集</Button>


    return <React.Fragment>
      {preview}
      {download}
      {move}
      {edit}
      {del}
      {apply}
      {editEncoding}
    </React.Fragment>
  }

  renderFrameDetail(data) {
    let result = null

    if (data.type === Constants.library.type.frame) {
      result = <React.Fragment>
        <div>
          <label>文字コード</label>
        </div>
        <div>
          {data.encoding}
        </div>
        <div>
          <label>改行コード</label>
        </div>
        <div>
          {data.newline}
        </div>
      </React.Fragment>
    }

    return result
  }

  render() {
    const { data } = this.props
    let content = null
    let label = ""
    if (data) {
      label = data.label
      content = <div>
        <div className={"mb-8px"}>
          {data.label}
        </div>
        <div className={style.actions}>
          {this.renderButtons()}
        </div>
        <div className={style.full_hr} />
        <div>
          <label>名称</label>
        </div>
        <div>
          {data.label}
        </div>
        {this.renderFrameDetail(data)}
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

      return <Resizer>
        <BaseInspector label={label} onBlurTitle={(e) => this.onBlurTitle(e)}>
          {content}
        </BaseInspector>
      </Resizer>
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