

import React from 'react'

import style from './style.scss'

import { NotificationManager } from 'Shared/Notification'
import { Loader, EmptyState } from 'Shared/Base'
import { CommonListRow, CommonListHeader } from 'Components/shared/ListRow'
import Constants from 'Constants/index'
import { API } from 'Modules/api/index'
import { Content, Inspector } from 'Modules/reducers/common'
import { Resizer } from 'Shared/Inspector'
import TrashInspector from './inspector/index'
import { LibraryModel, LibraryChild } from 'Model/index'
import { APIUtil, HttpUtil, ModalUtil } from 'Utils/index'
import { LocksModel, MessageModel } from 'Model/index'
import axios from 'axios'


type Props = {
  content: Content
  inspector: Inspector

  notify: Function
  dismissNotify: Function
}

type State = {
  isLoading: boolean
  selectedIndex: number

  model?: LibraryModel

  listRows: LibraryChild[]
}

const pageTitle = "コミ箱"
const headers = ['名前', '作成者', '作成日時']
const rowProps = ['label', 'creator', 'createdAt']
const hrefs = undefined

const emtpyTitle = 'ゴミ箱が空です'
const emptyDescription = '表示できるファイルがありません'


export default class TrashList extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      selectedIndex: -1,
      isLoading: false,
      listRows: []
    }
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  componentDidMount() {
    this.setState({
      isLoading: true
    }, () => {
      this.fetch()
        .then(() => {
          this.setState({
            isLoading: false
          })
        })
    })
  }

  fetch() {
    const { notify } = this.props

    return new Promise(async (resolve, reject) => {
      await API.request.doGet.trashes({})
        .then((response) => {
          if (response.data.data) {
            let model = new LibraryModel(response.data.data)
            if (model.isNotEmpty()) {
              this.setState({
                model: model,
                listRows: model.children
              })
            }
          } else {
            throw response.data
          }
        })
        .catch((e) => {
          console.log(e)
          notify({
            title: 'エラー',
            message: e.message,
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        })
      resolve()
    })
  }

  onClickRecovery(e, data) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.doRecovery(data)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '戻す',
      danger: true,
      content: <div>
        {data.label} を元の場所に戻しますか？
      </div>,
    })
  }

  doRecovery(data) {
    API.request.doPut.trash({ trashUUID: data.uuid })
      .then((response) => {
        if (!response.data.success) throw response.data

      })
      .catch((err) => {
        let message = new MessageModel(err)
        this.props.notify({
          title: message.title,
          message: message.message,
          status: message.messageStatus,
          dismissAfter: 0,
          closeButton: true
        })
      })
      .then(() => {
        this.fetch()
      })
  }

  

  renderContent() {
    let content = this.renderEmptyState()
    if (this.state.listRows.length > 0) {
      content = <React.Fragment>
        {this.renderListHeader()}
        {this.renderListRow()}
        {this.renderButtons()}
      </React.Fragment>
    }
    return <React.Fragment>
      {/* {this.renderPageTitle()} */}
      {content}
    </React.Fragment>
  }

  renderPageTitle() {
    return <div className={style.pageTitle}><label>{pageTitle}</label></div>
  }

  renderListHeader() {
    return <CommonListHeader headers={headers} hasIcon={true} />
  }

  toIcon(data: LibraryChild): string {
    let result = "warning"
    switch (data.type) {
      case Constants.library.type.document:
      case Constants.library.type.flow:
      case Constants.library.type.frame:
        result = "description"
        break
      case Constants.library.type.folder:
        result = "folder"
        break
      case Constants.library.type.database:
        result = "kskp_database"
        break
      case Constants.library.type.remoteFolder:
        result = "dns"
        break
      case Constants.library.type.trash:
        result = "delete_outline"
        break
    }
    return result
  }

  renderListRow() {
    let result: any = []

    this.state.listRows.forEach((data: LibraryChild, index) => {
      let isSelected = (this.state.selectedIndex >= 0 && this.state.selectedIndex === index) ? true : false
      let icon: string = this.toIcon(data)
      let listRow = <React.Fragment key={index}>
        <CommonListRow
          index={index} icon={icon}
          rowProps={rowProps} data={data} isSelected={isSelected}
          onClick={(e) => this.onClickRow(e, data, index)} />
      </React.Fragment>

      result.push(listRow)
    })

    return result
  }

  onClickRow(e, data: LibraryChild, index: number) {
    this.setState({
      selectedIndex: index
    })
  }

  onClickMove(e, libraryData: any) {
    HttpUtil.windowOpen('library?dialog=true&mode=folder_select', (folder_uuid) => {
      const type = libraryData.type
      const uuid = libraryData.uuid
      const data = {
        parent: folder_uuid
      }

      let result
      switch (type) {
        case Constants.library.type.folder:
          result = APIUtil.put('folders/' + uuid, data)
          break;
        case Constants.library.type.flow:
          result = this.editFlow(uuid, folder_uuid)
          break;
        case Constants.library.type.frame:
          result = APIUtil.put('frames/' + uuid, data)
          break;
        case Constants.library.type.document:
          result = APIUtil.put('documents/' + uuid, data)
          break;
        case Constants.library.type.database:
          result = APIUtil.put('databases/' + uuid, data)
          break;
        case Constants.library.type.remoteFolder:
          result = APIUtil.put('remote-folders/' + uuid, data)
          break;
      }
      if (!result) return
      result.then((response) => {
        this.fetch()
        if (!response.data.success) {
          this.props.notify({
            title: "エラー",
            message: response.data.message,
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        }
      })

    })
  }

  editFlow(flow_uuid, parent_uuid) {
    const { notify } = this.props
    let body = { target: flow_uuid }
    let locks = new LocksModel(flow_uuid)

    return axios.post('/api/v0/locks', body).then((response) => {
      let locksModel = locks.Parse(response)
      let lockId = locksModel.getLockId()
      if (lockId) {
        axios.put('/api/v0/flows/' + flow_uuid, {
          parent: parent_uuid,
          lock: lockId
        }).then((response) => {
          navigator.sendBeacon('/api/v0/delete-locks/' + lockId)
        }, (error) => {
          navigator.sendBeacon('/api/v0/delete-locks/' + lockId)
          console.log(error)
        })
      } else {
        // lockが出来なかった場合
        notify({
          title: "ライブラリー移動エラー",
          message: response.data.message,
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
      }
    })
  }

  renderEmptyState() {
    return <EmptyState icon={'inbox'} title={emtpyTitle} description={emptyDescription}></EmptyState>
  }

  renderButtons() {
    return null
  }

  renderButton(onClick: Function, title: string, icon: string) {

  }

  renderInspector() {
    const { content, inspector, notify } = this.props

    let data: LibraryChild | undefined
    if (this.state.selectedIndex >= 0) {
      data = this.state.listRows[this.state.selectedIndex]
    }
    return <React.Fragment key={this.state.selectedIndex}>
      <Resizer width={inspector.width}>
        <TrashInspector data={data}
          onClickRecovery={(e, data) => this.onClickRecovery(e, data)}
          onClickMove={(e, data) => this.onClickMove(e, data)}
        />
      </Resizer>
    </React.Fragment>
  }

  render() {
    const { content, inspector, notify } = this.props

    return <div className={style.listContainer} >
      <div className={style.content} >
        <Loader center={true} absolute={true} visible={this.state.isLoading} />
        {this.renderContent()}
      </div>
      <div className={style.inspector} >
        {this.renderInspector()}
      </div>
      <NotificationManager />
    </div>
  }
}