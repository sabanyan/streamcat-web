//@flow
import React from 'react'
import classnames from 'classnames'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import type { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button, DownloadButton } from 'Shared/Input'
import { APIUtil, ModalUtil, SortUtil, HttpUtil  } from "Utils/index";
import Visualizer from "Shared/Visualizer/Core";

type Props = {
  visualizers: [];
  data?: LibraryListDataType;
  onClickDelete?: Function;
  onClickApply?: Function;
  onClickMove?: Function;
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
        const content = {frame_uuid:uuid, visualize:v, headers:headers}
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

  isDialog () {
    return (HttpUtil.getURLParam('dialog'))
  }

  renderButtons() {
    const {data, onClickDelete, onClickApply, onClickMove} = this.props

    let preview, download, del, apply, move

    // preview button
    // download button
    if (data && data.label && data.type === Constants.library.type.frame) {
      preview = <Button onClick={(e) => this.onClickPreview(e)} icon={'visibility'}>プレビュー</Button>
      const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + data.uuid + "&ext=csv&label=" + data.label
      download = <DownloadButton href={href} icon={'get_app'}>CSVダウンロード</DownloadButton>
    }

    // move button
    if (onClickMove) move = <Button onClick={(data) => onClickMove(data)} icon={'arrow_right_alt'}>移動する　</Button>

    // delete button
    if (onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)}>削除する</Button>
  
    // apply button
    if (onClickApply) apply = <Button primary={true} onClick={() => onClickApply(data)}>選択する</Button>
    
    return <React.Fragment>
      {preview}
      {download}
      {del}
      {move}
      {apply}
    </React.Fragment>
  }

  render () {
    const {data, onClickDelete, onClickApply} = this.props
    let inspectorPreperty = (this.isDialog()) ? style.property_dialog : style.property
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