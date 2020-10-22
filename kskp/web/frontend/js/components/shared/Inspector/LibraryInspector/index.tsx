import React from 'react'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button, DownloadButton } from 'Shared/Input'
import { APIUtil, ModalUtil, StringUtil } from "Utils/index";
import { LibraryChild } from 'Model/index';
import { get } from '../../../../modules/api/response/index';
import { readyException } from 'jquery'

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
  onClickCleanTrash?: Function;
  onClickMemberInfo?: Function;
  updateAllowlist: Function;
}

type State = {
  members: {
    createdAt: string;
    creator: string;
    email: string;
    name: string;
    state: string;
    type: string;
    uuid: string;
  }[] | null,
  projectModifiedAt: string,
  allowlist: any
}
class LibraryInspector extends React.Component<Props, State> {
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
    this.state = {
      members: [],
      projectModifiedAt: "",
      allowlist: {}
    }
  }

  componentWillMount() {

    const { lastSelected, updateAllowlist } = this.props
    if (lastSelected && lastSelected.type === "project") {
      APIUtil.get("/projects/" + lastSelected.uuid + "?members=on&allowlist=on").then((response) => {
        if (response.data.success && response.data.data.members) {
          this.setState({
            members: response.data.data.members,
            projectModifiedAt: response.data.data.modifiedAt,
            allowlist: response.data.data.allowlist
          }, () => {
            updateAllowlist(this.state.allowlist)
          })
        }
      })
    }

    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.PREVIEW_DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.modal.PREVIEW_DATASOURCE)
      },
    })
  }

  onClickPreview(e) {
    // dataがない（Null)の場合はPreviwボタンは表示しない（render)
    let { lastSelected } = this.props;
    let library: LibraryListDataType = lastSelected;
    let uuid = library.uuid
    // uuidだけでプレビュー
    window.open('/preview?step_id=' + null + '&dialog=true&frame_uuid=' + uuid + '&title=' + StringUtil.urlEncode(library.label));
  }

  onClickEdit(e) {
    const { lastSelected, onClickEdit } = this.props
    if (onClickEdit) onClickEdit(lastSelected)
  }

  renderButtons(data?: LibraryChild) {
    const { selected, onClickDelete, onClickApply, onClickMove, onClickEdit, onClickEditEncoding, onClickCleanTrash } = this.props

    let preview, download, del, apply, move, edit, editEncoding, trashClean


    if (selected.length == 1) {
      // preview button
      if (this.state.allowlist.read && data && data.label && data.type === Constants.library.type.frame) {
        preview = <Button onClick={(e) => this.onClickPreview(e)} icon={"visibility"}>プレビューする</Button>
      }

      // download button
      if (this.state.allowlist.download && data && data.label && data.type === Constants.library.type.frame) {
        const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + data.uuid + "&ext=csv&label=" + data.label
        download = <DownloadButton href={href} icon={"get_app"}>CSVをダウンロードする</DownloadButton>
      }

      // edit
      if (onClickEdit && data && data.type === Constants.library.type.database) {
        edit = <Button onClick={(e) => this.onClickEdit(e)} icon={"settings"}>設定を開く</Button>
      }

      // apply button
      if (onClickApply) apply = <Button primary={true} onClick={() => onClickApply(data)}>選択する</Button>

      // editEncoding
      if (this.state.allowlist.update && onClickEditEncoding && data && data.type === Constants.library.type.frame) {
        editEncoding = <Button onClick={() => onClickEditEncoding(data)} icon={'edit'}>文字コードを編集する</Button>
      }

      // clean trash button
      if (this.state.allowlist.delete && onClickCleanTrash) trashClean = <Button onClick={(data) => onClickCleanTrash(data)} danger={true} icon={"delete"}>ゴミ箱を空にする</Button>

    }

    // 複数選択の場合
    if (selected.length >= 1) {
      // delete button
      if (this.state.allowlist.delete  && onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={"delete"}>削除する</Button>

      // move button
      if (onClickMove && this.state.allowlist.move)  move = <Button onClick={(data) => onClickMove(data)} icon={"open_in_browser"}>移動する</Button>
    }

    if (onClickCleanTrash) {
      // ゴミ箱の場合、削除と移動を非表示にする
      del = null;
      move = null;
    }

    return <React.Fragment>
      {preview}
      {download}
      {edit}
      {move}
      {del}
      {apply}
      {editEncoding}
      {trashClean}
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
    let content: any = <div className={style.inspector}>
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

  renderProjectInfo(project: any) {
    const { onClickMemberInfo } = this.props;
    const memberCount = this.state.members ? this.state.members.length : 0
    let members: any = null
    if (this.state.members) {
      members = this.state.members.map((member) => {
        return <div key={member.email}>{member.name + "(" + member.type + ")"}</div>
      })
    }


    return <React.Fragment>
      <label>{"このプロジェクトのメンバー（" + memberCount + ")"}</label>
      {(this.state.allowlist.updateMember && onClickMemberInfo) ? <Button onClick={(e) => onClickMemberInfo(e, this.state.members, project.uuid, this.state.projectModifiedAt)} icon={"people"}>メンバーを編集する</Button> : null}
      <div className={style.memberList}>
        {this.state.allowlist.findMember && members}
      </div>
    </React.Fragment>
  }

  render() {
    const { selected, lastSelected } = this.props
    let label = (lastSelected && selected.length <= 1) ? lastSelected.label : undefined
    let content = (selected.length <= 1) ? this.renderSelect(lastSelected) : this.renderSelects(selected, lastSelected)

    const disabled = this.state.allowlist.update ? false : true

    return <Resizer>
      <BaseInspector label={label} onBlurTitle={this.props.onBlurTitle} disabled={disabled}>
        {content}
        {(lastSelected && lastSelected.type === "project") ? this.renderProjectInfo(lastSelected) : null}
      </BaseInspector>
    </Resizer>
  }

}

export default LibraryInspector
