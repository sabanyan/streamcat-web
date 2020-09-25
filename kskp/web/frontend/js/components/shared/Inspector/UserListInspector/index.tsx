import React from 'react'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import { UserListUser } from 'Types/index'
import moment from 'moment/moment'
import Constants from 'Constants/index'
import { Button, DownloadButton } from 'Shared/Input'
import { APIUtil, ModalUtil, StringUtil } from "Utils/index";
import { LibraryChild } from 'Model/index';

type Props = {
  selected: UserListUser[];
  lastSelected?: UserListUser;
  onClickDelete?: Function;
  onBlurTitle?: Function;
  onClickEdit?: Function;
}

class UserListInspector extends React.Component<Props> {
  display = {
    email: 'E-mail',
    projects: '所属プロジェクト',
    status: 'ステータス',
    admin_types: 'KSKP 管理者',
    password: '仮パスワード',
  }

  constructor(props: Props) {
    super(props)
  }

  componentWillMount() {
    //モーダル処理の登録
    // ModalUtil.registerModal({
    //   id: Constants.modal.PREVIEW_DATASOURCE, onClickOK: () => {
    //     ModalUtil.closeModal(Constants.modal.PREVIEW_DATASOURCE)
    //   },
    // })
  }

  onClickEdit(e) {
    const { lastSelected, onClickEdit } = this.props
    if (onClickEdit) onClickEdit(lastSelected)
  }

  renderButtons(data?: UserListUser) {
    const { selected, onClickDelete} = this.props

    let del

    // 複数選択の場合
    if (selected.length >= 1) {
      // delete button
      if (onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={"delete"}>削除する</Button>
    }
    return <React.Fragment>
      {del}
    </React.Fragment>
  }

  renderDetail(data?: UserListUser) {
    let result: any = []
    console.log("renderDetail",data);
    if (!data) return result

    if (data.email) {
      let label = <React.Fragment key={data.email}>
        <div><label>{this.display.email}</label></div>
        <div className={"mb-8px"}>{data.email}</div>
      </React.Fragment>
      result.push(label)
    }

    if (data.status) {
      let status = <React.Fragment key={data.status}>
        <div><label>{this.display.status}</label></div>
        <div className={"mb-8px"}>{data.status}</div>
      </React.Fragment>
      result.push(status)
    }
    //
    //   // 改行コードがあれば、表示する
    //   let newline
    //   if (data.newline) {
    //     newline = <React.Fragment key={data.newline}>
    //       <div><label>{this.display.newline}</label></div>
    //       <div className={"mb-8px"}>{data.newline}</div>
    //     </React.Fragment>
    //
    //     result.push(newline)
    //   }
    // }
    //
    //
    // // 作成者があれば、表示する
    // let creator
    // if (data.creator) {
    //   creator = <React.Fragment key={data.creator}>
    //     <div><label>{this.display.creator}</label></div>
    //     <div className={"mb-8px"}>{data.creator}</div>
    //   </React.Fragment>
    //
    //   result.push(creator)
    // }
    //
    // // 作成日時があれば、表示する
    // let createdAt
    // if (data.createdAt) {
    //   createdAt = <React.Fragment key={data.createdAt}>
    //     <div><label>{this.display.createdAt}</label></div>
    //     <div className={"mb-8px"}>{moment(data.createdAt).format(Constants.format.dateTime)}</div>
    //   </React.Fragment>
    //
    //   result.push(createdAt)
    // }

    return <React.Fragment>
      {result}
    </React.Fragment>
  }

  renderSelect(data?: UserListUser) {
    let content: any = <div className={style.inspector}>
      <div className={style.actions}>
        {this.renderButtons(data)}
      </div>
      <div className={style.detail}>
        {this.renderDetail(data)}
      </div>
    </div>

    console.log("renderSelect")
    return content
  }

  renderSelects(selected: UserListUser[], data?: UserListUser) {
    let content = <div className={style.inspector}>
      <div className={style.actions}>
        {this.renderButtons(data)}
      </div>
      <div className={style.detail}>

      </div>
    </div>
    console.log("renderSelects")

    return content
  }

  render() {
    const { selected, lastSelected } = this.props
    let label = (lastSelected && selected.length <= 1) ? lastSelected.name : undefined
    console.log(selected.length)
    console.log(lastSelected)
    let content = (selected.length <= 1) ? this.renderSelect(lastSelected) : this.renderSelects(selected, lastSelected)

    return <Resizer>
      <BaseInspector label={label} onBlurTitle={this.props.onBlurTitle} disabled={true}>
        {content}
      </BaseInspector>
    </Resizer>
  }

}

export default UserListInspector
