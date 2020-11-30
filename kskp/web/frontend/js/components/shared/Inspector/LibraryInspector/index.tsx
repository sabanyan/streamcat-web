import React from 'react'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import { LibraryListDataType } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button, DownloadButton } from 'Shared/Input'
import { APIUtil, ModalUtil, StringUtil, HttpUtil } from "Utils/index";
import { LibraryChild } from 'Model/index';
import { Allowlist, ProjectInfo } from 'Components/LibraryContainer/Libary/index';

type Props = {
  currentProject: ProjectInfo;
  allowlist: Allowlist;
  selectedData: LibraryChild;
  onClickDelete?: Function;
  onClickApply?: Function;
  onClickMove?: Function;
  onBlurTitle?: Function;
  onClickEdit?: Function;
  onClickEditEncoding?: Function;
  onClickCleanTrash?: Function;
  onClickMemberInfo?: Function;
  onChangeFlowLock?: Function;
  onClickCopy?: Function;
}

class LibraryInspector extends React.Component<Props> {
  display = {
    label: '名称',
    encoding: '文字コード',
    newline: '改行コード',
    creator: '作成者',
    createdAt: '作成日時',
    prevFolderPath: "捨てる前の場所",
    fileSize: 'サイズ(byte)'
  }

  constructor(props: Props) {
    super(props)
  }

  componentWillMount() {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.PREVIEW_DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.modal.PREVIEW_DATASOURCE)
      },
    })
  }

  onClickPreview(e) {
    // dataがない（Null)の場合はPreviwボタンは表示しない（render)
    let { selectedData } = this.props;
    let library: LibraryListDataType = selectedData;
    let uuid = library.uuid
    // uuidだけでプレビュー
    window.open('/preview?step_id=' + null + '&dialog=true&frame_uuid=' + uuid + '&title=' + StringUtil.urlEncode(library.label));
  }

  onClickEdit(e) {
    const { selectedData, onClickEdit } = this.props
    if (onClickEdit) onClickEdit(selectedData)
  }

  renderButtons(data?: LibraryChild) {
    const { selectedData, allowlist, onClickDelete, onClickApply, onClickMove, onClickEdit, onClickEditEncoding, onClickCleanTrash, onChangeFlowLock, onClickCopy } = this.props

    let preview, download, del, apply, move, edit, editEncoding, trashClean, lock, projectInfo, copy;

    // preview button
    if (allowlist.read && data && data.label && data.type === Constants.library.type.frame) {
      preview = <Button onClick={(e) => this.onClickPreview(e)} icon={"visibility"}>プレビューする</Button>
    }

    // download button
    if (allowlist.download && data && data.label && data.type === Constants.library.type.frame) {
      const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + data.uuid + "&ext=csv&label=" + data.label
      download = <DownloadButton href={href} icon={"get_app"}>CSVをダウンロードする</DownloadButton>
    }

    // edit
    if (allowlist.update && onClickEdit && data && data.type === Constants.library.type.database) {
      edit = <Button onClick={(e) => this.onClickEdit(e)} icon={"settings"}>設定を開く</Button>
    }

    // apply button
    if (onClickApply) apply = <Button primary={true} onClick={() => onClickApply(data)}>選択する</Button>

    // editEncoding
    if (allowlist.update && onClickEditEncoding && data && data.type === Constants.library.type.frame) {
      editEncoding = <Button onClick={() => onClickEditEncoding(data)} icon={'edit'}>文字コードを編集する</Button>
    }

    // clean trash button
    if (allowlist.delete && onClickCleanTrash) trashClean = <Button onClick={(data) => onClickCleanTrash(data)} danger={true} icon={"delete"}>ゴミ箱を空にする</Button>

    // flow lock button
    if (allowlist.lock && data && data.type == Constants.library.type.flow && onChangeFlowLock) {
      lock = <div className={style.flowLock}>
        <input id="flowLock" type="checkbox" checked={data.editLock ? true : false} onChange={(e) => onChangeFlowLock(e, data)}></input>
        <label htmlFor="flowLock">編集ロック</label>
      </div>
    }

    // delete button
    if (allowlist.delete && onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={"delete"}>削除する</Button>

    // move button
    if (allowlist.move && onClickMove) move = <Button onClick={(data) => onClickMove(data)} icon={"open_in_browser"}>移動する</Button>

    if (onClickCleanTrash) {
      // ゴミ箱の場合、削除と移動を非表示にする
      del = null;
      move = null;
    }

    if (allowlist.copy && data &&  data.type == Constants.library.type.flow && onClickCopy) {
      copy = <Button onClick={(e) => onClickCopy(e, data)} icon={"content_copy"}>複製する</Button>
    }

    return <React.Fragment>
      {preview}
      {download}
      {edit}
      {move}
      {copy}
      {apply}
      {editEncoding}
      {del}
      {trashClean}
      {lock}
    </React.Fragment>
  }

  renderDetail(data?: LibraryChild) {
    const { selectedData } = this.props;
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
      let encoding, fileSize
      if (data.encoding) {
        encoding = <React.Fragment key={data.encoding}>
          <div><label>{this.display.encoding}</label></div>
          <div className={"mb-8px"}>{data.encoding}</div>
        </React.Fragment>

        result.push(encoding)
      }

      if (data.fileSize　!== undefined) {
        fileSize = <React.Fragment key={data.fileSize}>
          <div><label>{this.display.fileSize}</label></div>
          {data.fileSize ? <div className={"mb-8px"}>{data.fileSize}</div> : 0}
        </React.Fragment>
        result.push(fileSize)
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
        <div className={"mb-8px"}>{moment(data.createdAt, 'YYYY-MM-DD hh:mm:ss', false).format('YYYY-MM-DD HH:mm')}</div>
      </React.Fragment>

      result.push(createdAt)
    }

    if (data && data.type == "project") {
      const projectInfo = this.renderProjectInfo(selectedData)
      result.push(projectInfo)
    }

    return <React.Fragment>
      {result}
    </React.Fragment>
  }

  renderSelect(data?: LibraryChild) {
    let content: any = <div className={style.inspector}>
      <div className={style.actions}>
        {this.renderButtons(data)}
      </div>
      <div className={style.full_hr} />
      <div className={style.detail}>
        {this.renderDetail(data)}
      </div>
    </div>

    return content
  }

  memberTypeToRoleName(type:string) {
    let result:string;

    switch(type) {
      case 'Reader' :
        result = Constants.projectMemberRole.READER;
        break;
      case 'Writer' :
        result = Constants.projectMemberRole.WRITER;
        break;
      case 'Owner'  :
          result = Constants.projectMemberRole.OWNER;
        break;

      default: 
        result = "unknown";
        break;
    }

    return result
  }

  renderProjectInfo(project: any) {
    const { currentProject, allowlist, onClickMemberInfo } = this.props;
    if (!onClickMemberInfo) return null;
    const members = currentProject.members;
    const memberCount = members ? members.length : 0;
    let membersForm: any = null
    if (members) {
      membersForm = members.map((member) => {
        return <div key={member.email}>{member.name + "(" + this.memberTypeToRoleName(member.type) + ")"}</div>
      })
    }

    return <React.Fragment key={"project-info"}>
      <div className={style.full_hr} />
      <label>{"このプロジェクトのメンバー(" + memberCount + ")"}</label>
      {(allowlist && allowlist.updateMember && onClickMemberInfo) ? <Button onClick={(e) => onClickMemberInfo(e, project.uuid)} icon={"people"}>メンバーを編集する</Button> : null}
      <div className={style.memberList}>
        {allowlist && allowlist.findMember && members ? membersForm : null}
      </div>
    </React.Fragment>
  }

  render() {
    const { allowlist, selectedData, onBlurTitle } = this.props
    if (!selectedData) return;
    let label = selectedData.label
    let content = this.renderSelect(selectedData)

    const disabled = allowlist && allowlist.update ? false : true

    return <Resizer>
      <BaseInspector key={selectedData.uuid} label={label} onBlurTitle={(onBlurTitle) ? (e) => { onBlurTitle(e, selectedData) } : null} disabled={disabled}>
        {content}
      </BaseInspector>
    </Resizer>
  }

}

export default LibraryInspector
