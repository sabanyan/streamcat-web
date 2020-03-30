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
  onEditEncodings?: Function;
}

type State = {
  isEditable: boolean;
  data?: LibraryListDataType;
}

class LibraryInspector extends React.Component<Props> {
  constructor(props: Props) {
    super(props)

    this.state = {
      isEditable: false,
      data: props.data
    }
  }

  onBlurTitle(e: SyntheticInputEvent<EventTarget>) {
    if (this.props.onBlurTitle) {
      this.props.onBlurTitle(e)
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isEditable: false,
      data: nextProps.data
    })
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
    const { data, onClickDelete, onClickApply, onClickMove, onClickEdit } = this.props

    let preview, download, del, apply, move, edit

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

    return <React.Fragment>
      {preview}
      {download}
      {move}
      {edit}
      {del}
      {apply}
    </React.Fragment>
  }

  setDetailEditable(isEditable: boolean) {
    this.setState({
      isEditable: isEditable
    })
  }

  onStartEditDetail(e) {
    this.setState({
      isEditable: true
    }, () => {

    })
  }

  onEndEditDetail(e) {
    const { saveDataDetail } = this.props
    this.setState({
      isEditable: false
    }, () => {
      saveDataDetail(e, this.state.data)
    })
  }

  onChangeEncoding(e) {
    const { onChangeDataDetail } = this.props

    let data = this.state.data
    data.encoding = e.target.value
    onChangeDataDetail(e, data)
  }

  onChangeNewline(e) {
    const { onChangeDataDetail } = this.props

    let data = this.state.data
    data.newline = e.target.value
    onChangeDataDetail(e, data)
  }

  renderFrameDetail(data) {
    let result = null

    if (!data || data.type !== Constants.library.type.frame) return result
    let edit = <Button class={style.editDetailButton} onClick={(e) => this.onStartEditDetail(e)} icon={'edit'}></Button>
    let done = <Button class={style.editDetailButton} onClick={(e) => this.onEndEditDetail(e)} icon={'done'}></Button>

    let button = (this.state.isEditable) ? done : edit

    let encodings = []
    Constants.encodings.forEach((value) => {
      let encoding = <React.Fragment key={value}>
        <option value={value}>{value}</option>
      </React.Fragment>
      encodings.push(encoding)
    })

    let newlines = []
    Constants.newlines.forEach((value) => {
      let newline = <React.Fragment key={value}>
        <option value={value}>{value}</option>
      </React.Fragment>
      newlines.push(newline)
    })

    result = <React.Fragment>
      <div>
        <label>文字コード</label>
      </div>
      <select className={style.encoding} value={data.encoding} disabled={!this.state.isEditable} onChange={(e) => this.onChangeEncoding(e)}>
        {encodings}
      </select>
      {button}
      <div>
        <label>改行コード</label>
      </div>
      <div>
        <select className={style.newline} value={data.newline} disabled={!this.state.isEditable} onChange={(e) => this.onChangeNewline(e)}>
          {newlines}
        </select>
      </div>
    </React.Fragment>

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