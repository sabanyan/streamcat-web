import React from 'react'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button, DownloadButton } from 'Shared/Input'
import { APIUtil, ModalUtil, SortUtil, HttpUtil, ErrorUtil, ReactDomUtil } from "Utils/index";
import { LibraryChild } from 'Model/index';

type Props = {
  visualizers: any[];
  selected: LibraryChild[];
  lastSelected?: LibraryChild;
  onClickDelete?: Function;
  onClickApply?: Function;
  onClickMove?: Function;
  onBlurTitle?: Function;
  onClickEdit?: Function;
  onClickEditEncoding?: Function;
}

class LibraryInspector extends React.Component<Props> {
  display = {
    label: '名称',
    encoding: '文字コード',
    newline: '改行コード',
    creator: '作成者',
    createdAt: '作成日時',
    prevFolderPath: "捨てる前の場所"
  }

  constructor(props: Props) {
    super(props)
  }

  componentWillMount() {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.preview.DATASOURCE)
      },
    })
  }

  onBlurTitle(e: React.FocusEvent<HTMLInputElement>) {
    if (this.props.onBlurTitle) {
      this.props.onBlurTitle(e)
    }
  }

  onClickPreview(e) {
    // dataがない（Null)の場合はPreviwボタンは表示しない（render)
    let { lastSelected, visualizers } = this.props

    try {
      if (!lastSelected) throw "LibraryInspector onClickPreview undefined data"
      if (!visualizers) throw "LibraryInspector onClickPreview undefined visualizers"

      let library: LibraryListDataType = lastSelected
      visualizers = SortUtil.getSortedContents(visualizers)

      let id = library.uuid

      // vizs
      this.setState({
        loading: true
      }, () => {
        let contents: any[] = []
        for (const v of visualizers) {
          let viz = { frame_uuid: library.uuid, visualize: v }
          let content: any = { title: v.label, content: viz, parentProps: this.props, id: id }
          contents.push(content)
        }

        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          contents: contents,
          title: library.label
        })
      })
    } catch (e) {
      console.log(e)
    }
  }

  onClickEdit(e) {
    const { lastSelected, onClickEdit } = this.props
    if (onClickEdit) onClickEdit(lastSelected)
  }

  renderDownloadButton() {

  }
  renderButtons(data?: LibraryChild) {
    const { selected, onClickDelete, onClickApply, onClickMove, onClickEdit, onClickEditEncoding } = this.props

    let preview, download, del, apply, move, edit, editEncoding

    // 
    if (selected.length == 1) {
      // preview button
      if (data && data.label && data.type === Constants.library.type.frame) {
        preview = <Button onClick={(e) => this.onClickPreview(e)} icon={'visibility'}>プレビュー</Button>
      }

      // download button
      if (data && data.label && data.type === Constants.library.type.frame) {
        const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + data.uuid + "&ext=csv&label=" + data.label
        download = <DownloadButton href={href} icon={'get_app'}>CSVダウンロード</DownloadButton>
      }

      // edit
      if (onClickEdit && data && data.type === Constants.library.type.database) {
        edit = <Button onClick={(e) => this.onClickEdit(e)} icon={'create'}>編集する</Button>
      }

      // apply button
      if (onClickApply) apply = <Button primary={true} onClick={() => onClickApply(data)}>選択する</Button>
    }

    if (selected.length >= 1) {
      // delete button
      if (onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)}>削除する</Button>

      // move button
      if (onClickMove) move = <Button onClick={(data) => onClickMove(data)} icon={'arrow_right_alt'}>移動する</Button>

      // editEncoding
      if (onClickEditEncoding && data && data.type === Constants.library.type.frame) editEncoding = <Button onClick={() => onClickEditEncoding(data)} icon={'edit'}>文字コード編集</Button>

    }

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

  renderDetail(data?: LibraryChild) {
    let result: any = []
    if (!data) return result

    // ラベルがあれば、表示する
    let label
    if (data.label) {
      label = <React.Fragment key={data.label}>
        <div><label>{this.display.label}</label></div>
        <div className={"mb-8px"}>{data.label}</div>
      </React.Fragment>

      result.push(label)
    }

    if (data.type === Constants.library.type.frame) {
      // 文字コードがあれば、表示する
      let encoding
      if (data.encoding) {
        encoding = <React.Fragment key={data.encoding}>
          <div><label>{this.display.encoding}</label></div>
          <div className={"mb-8px"}>{data.encoding}</div>
        </React.Fragment>

        result.push(encoding)
      }

      // 改行コードがあれば、表示する
      let newline
      if (data.newline) {
        newline = <React.Fragment key={data.newline}>
          <div><label>{this.display.newline}</label></div>
          <div className={"mb-8px"}>{data.newline}</div>
        </React.Fragment>

        result.push(newline)
      }
    }


    // 作成者があれば、表示する
    let creator
    if (data.creator) {
      creator = <React.Fragment key={data.creator}>
        <div><label>{this.display.creator}</label></div>
        <div className={"mb-8px"}>{data.creator}</div>
      </React.Fragment>

      result.push(creator)
    }

    // 作成日時があれば、表示する
    let createdAt
    if (data.createdAt) {
      createdAt = <React.Fragment key={data.createdAt}>
        <div><label>{this.display.createdAt}</label></div>
        <div className={"mb-8px"}>{moment(data.createdAt).format(Constants.format.dateTime)}</div>
      </React.Fragment>

      result.push(createdAt)
    }

    /*
    let prevFolderPath
    if (data.prevFolderPath) {
      prevFolderPath = <React.Fragment key={data.prevFolderPath}>
        <div><label>{this.display.prevFolderPath}</label></div>
        <div className={"mb-8px"}>{data.prevFolderPath}</div>
      </React.Fragment>
      result.push(prevFolderPath)
    }
    */

    return <React.Fragment>
      {result}
    </React.Fragment>
  }

  renderSelect(data?: LibraryChild) {
    let content:any = <div className={style.inspector}>
      <div className={style.actions}>
        {this.renderButtons(data)}
      </div>
      <div className={style.detail}>
        {this.renderDetail(data)}
      </div>
    </div>

    return content
  }

  renderSelects(selected: LibraryChild[], data?: LibraryChild) {
    let content = <div className={style.inspector}>
      <div className={style.actions}>
        {this.renderButtons(data)}
      </div>
      <div className={style.detail}>
      </div>
    </div>

    return content
  }

  render() {
    const { selected, lastSelected } = this.props
    let label = (lastSelected && selected.length <= 1) ? lastSelected.label : undefined
    let content = (selected.length <= 1) ? this.renderSelect(lastSelected) : this.renderSelects(selected, lastSelected)

    return <Resizer>
      <BaseInspector label={label} onBlurTitle={(e) => this.onBlurTitle(e)}>
        {content}
      </BaseInspector>
    </Resizer>
  }

}

export default LibraryInspector