//@flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import libraryListStyle from '../../shared/List/LibraryList/style.scss'
import ModalManager from '../../shared/ModalManager'
import Loader from '../../shared/Loader'
import EmptyState from '../../shared/EmptyState'
import LibraryInspector from '../../shared/Inspector/LibraryInspector'
import NotificationManager from '../../shared/NotificationManager'
import APIUtil from '../../../utils/APIUtil'
import LibraryList from '../../shared/List/LibraryList'
import LibraryListHeader from '../../shared/List/LibraryList/LibraryListHeader'
import ModalUtil from '../../../utils/ModalUtil'
import Constants from '../../../constants'
import FileUploader from '../../shared/FileUploader'
import type { BreadCrumbHistoryType, LibraryListDataType, UploadedFileType, } from '../../../types'
import BreadCrumb from '../../shared/BreadCrumb'
import TextField from '../../shared/TextField'
import ReactDomUtil from '../../../utils/ReactDomUtil'
import ErrorUtil from '../../../utils/ErrorUtil'
import type { LibraryProps } from '../index'
import HttpUtil from '../../../utils/HttpUtil'

type Props = {
  ...LibraryProps
}

type State = {
  stores: [];
  libraryChildren: [];
  folderPath: [];
  is_loading: boolean;
  is_finished: boolean;
  selected_data?: LibraryListDataType | null;
  currentFolderUUID: string;
  upload_file?: UploadedFileType | null;
  frame_name: string;
  document_name: string;
  folder_name: string;
  mode: string;
}

export default class Library extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)

    const mode = HttpUtil.getURLParam('dialog') ? Constants.library.mode.dialog : Constants.library.mode.list

    //TODO ReduxのStoreで管理する
    this.state = {
      stores: [],
      folderPath: [],
      libraryChildren: [],
      currentFolderUUID: '',//現在のフォルダのuuid
      is_loading: false,
      is_finished: false,
      selected_data: null,
      upload_file: null,
      frame_name: '',
      document_name: '',
      folder_name: '',
      mode: mode
    }
  }

  componentDidMount () {
    this.fetchFolder()
    this.registerModal()
  }

  fetchFolder () {
    const getStores = this.getStores()
    const getFolderChildren = this.getFolderChildren()
    Promise.all([getStores, getFolderChildren]).then(() => {
      this.setState({is_loading: false, is_finished: true})
    })
  }

  registerModal () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_DOCUMENT, onClickDone: () => {
        if (!this.state.document_name) {
          alert('資料名を入力してください')
          return false
        }
        if (!this.state.upload_file) {
          alert('ファイルを選択してください')
          return false
        }
        this.setState({is_loading: true, selected_data: null})
        const file: File = this.state.upload_file.file
        const label = this.state.document_name
        const parentUUID = this.state.currentFolderUUID
        APIUtil.documentUpload(file, label, parentUUID).then((response) => {
          this.completeUploaded(response)
          ModalUtil.closeModal(Constants.modal.ADD_DOCUMENT)
        }, () => {
          this.unhandledNotify()
        })
      },
    })
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FRAME, onClickDone: () => {
        if (!this.state.frame_name) {
          alert('名称を入力してください')
          return false
        }
        if (!this.state.upload_file) {
          alert('ファイルを選択してください')
          return false
        }
        this.setState({is_loading: true, selected_data: null})
        const file: File = this.state.upload_file.file
        const fileName = this.state.frame_name //TODO 将来的には使わない
        const label = this.state.frame_name
        const parentUUID = this.state.currentFolderUUID
        APIUtil.frameUpload(file, fileName, label, parentUUID).then((response) => {
          this.completeUploaded(response)
          ModalUtil.closeModal(Constants.modal.ADD_FRAME)
        }, () => {
          this.unhandledNotify('アップロードエラー')
        })
      },
    })
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FOLDER, onClickDone: () => {
        if (!this.state.folder_name) {
          alert('ファルダ名を入力してください')
          ModalUtil.closeModal(Constants.modal.ADD_FRAME)
          return false
        }
        this.setState({is_loading: true, selected_data: null})
        const body = {
          'label': this.state.folder_name,
          'parent': this.state.currentFolderUUID,
        }
        APIUtil.post('folders', body).then((response) => {
          this.completeAddedFolder(response)
          ModalUtil.closeModal(Constants.modal.ADD_FOLDER)
        }, () => {
          this.unhandledNotify('フォルダ作成エラー')
        })
      },
    })
  }

  unhandledNotify (title: string) {
    this.setState({is_loading: false})
    this.props.notify({
      title: title,
      message: Constants.errorMessage.unhandledError,
      status: 'error',
      dismissAfter: 0,
      closeButton: true
    })
  }

  completeAddedFolder (response: any) {
    const json = response.data.data
    this.setState({is_loading: false})
    if (!response.data.success) {
      this.props.notify({
        title: 'フォルダ作成エラー',
        message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
        status: 'error',
        dismissAfter: 0,
        closeButton: true
      })
    } else {
      this.props.notify({
        title: 'フォルダを作成しました',
        message: this.state.folder_name + 'を作成しました',
        status: 'success'
      })
    }
    this.fetchFolder()
  }

  completeUploaded (response: any) {
    const json = response.data.data
    const success = response.data.success
    this.setState({is_loading: false})

    if (!success) {
      this.props.notify({
        title: 'アップロードエラー',
        message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
        status: 'error',
        dismissAfter: 0,
        closeButton: true
      })
    } else {
      this.props.notify({
        title: 'アップロードしました',
        message: this.state.frame_name + 'をアップロードしました',
        status: 'success'
      })
    }
    this.fetchFolder()
  }

  onChangeFile (e: SyntheticInputEvent<EventTarget>) {
    const selectedFiles: FileList = e.target.files
    if (selectedFiles) {
      const uploadFile: File = selectedFiles[0]
      this.setState({
        upload_file: {
          file: uploadFile,
        },
      })
    }
  }

  //storesの取得処理
  getStores () {
    return APIUtil.get('stores').then((response) => {
      const json = response.data.data
      this.setState({stores: json.stores})
    })
  }

  //libraryの取得処理
  getFolderChildren () {
    if (inject_folder_uuid) {
      //該当フォルダを取得
      return APIUtil.get('folders/' + inject_folder_uuid).then((response) => {
        const json = response.data.data
        if (response.data.success) {
          this.setState({
            libraryChildren: json.children,
            folderPath: json.folderPath,
            currentFolderUUID: inject_folder_uuid,
          })
        }
      })
    } else {
      //ルートを取得
      return APIUtil.get('library').then((response) => {
        const json = response.data.data
        if (response.data.success) {
          this.setState({
            libraryChildren: json.children,
            folderPath: json.folderPath,
            currentFolderUUID: json.uuid,
          })
        }
      })
    }
  }

  onChangeDocumentName (e: SyntheticInputEvent<EventTarget>, validation) {
    this.setState({
      document_name: e.target.value,
    })
  }

  onChangeFrameName (e: SyntheticInputEvent<EventTarget>, validation) {
    this.setState({
      frame_name: e.target.value,
    })
  }

  onChangeFolderName (e: SyntheticInputEvent<EventTarget>, validation) {
    this.setState({
      folder_name: e.target.value,
    })
  }

  onClickNewDocument (e: SyntheticInputEvent<EventTarget>, validation) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_DOCUMENT,
      visible: true,
      done: '追加する',
      content: <div>
        <TextField placeholder={'資料名'}
                   onChange={(e, validation) => this.onChangeDocumentName(e,
                     validation)} />
        <div className={'mt-8px'} />
        <FileUploader accept={['*/*']} onChangeFile={(e) => this.onChangeFile(e)} />
      </div>,
    })
    e.preventDefault()
  }

  onClickNewFrame (e: SyntheticInputEvent<EventTarget>) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FRAME,
      visible: true,
      done: '追加する',
      content: <div>
        <TextField placeholder={'名称'}
                   onChange={(e, validation) => this.onChangeFrameName(e,
                     validation)} />
        <div className={'mt-8px'} />
        <FileUploader accept={['text/csv']} onChangeFile={(e) => this.onChangeFile(e)} />
      </div>,
    })
    e.preventDefault()
  }

  onClickNewFolder (e: SyntheticInputEvent<EventTarget>) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FOLDER,
      visible: true,
      done: '追加する',
      content: <div>
        <TextField placeholder={'フォルダ名'}
                   onChange={(e, validation) => this.onChangeFolderName(e,
                     validation)} />
      </div>,
    })
    e.preventDefault()
  }

  onClickNewDatabase (e: SyntheticInputEvent<EventTarget>) {
    this.setState({is_loading: true, selected_data: null})
    const body = {
      'label': 'データベース1',
      'parent': this.state.currentFolderUUID,
      'dbms': 'ORACLE',
      'connectionString': 'data source=myDB;user id=user01;password=pass01;',
    }
    APIUtil.post('databases', body).then((response) => {
      const json = response.data.data
      this.setState({is_loading: false})
    })
    e.preventDefault()
  }

  onClickNewRemoteFolder (e: SyntheticInputEvent<EventTarget>) {
    this.setState({is_loading: true, selected_data: null})
    const body = {
      'label': '新しいフォルダ',
      'parent': this.state.currentFolderUUID,
      'user': 'user1',
      'password': 'pass',
      'server': '192.168.0.3',
      'port': '139',
      'domain': 'WORKGROUP',
      'directory': 'share',
    }

    APIUtil.post('remote-folders', body).then((response) => {
      const json = response.data.data
      this.setState({is_loading: false})
    })
    e.preventDefault()
  }

  renderNewFolder () {
    return this.renderNew((e) => this.onClickNewFolder(e), 'ディレクトリを作成する')
  }

  renderNewDatabase () {
    return this.renderNew((e) => this.onClickNewDatabase(e), 'データベースを追加する')
  }

  renderNewDocument () {
    return this.renderNew((e) => this.onClickNewDocument(e), '資料をアップロードする')
  }

  renderNewFrame () {
    return this.renderNew((e) => this.onClickNewFrame(e), 'CSVをアップロードする')
  }

  renderNewRemoteFolder () {
    return this.renderNew((e) => this.onClickNewRemoteFolder(e), 'ファイルサーバを追加する')
  }

  renderNew (onClick: Function, title: string) {
    return <a
      className={classnames(libraryListStyle.library, libraryListStyle.new)}
      href="#" onClick={(e) => onClick(e)}>
      <div className={libraryListStyle.library_list}>
        <div className={libraryListStyle.name}>
          <i className={classnames('material-icons',
            [libraryListStyle.icon])}>add_circle_outline</i>
          {title}
        </div>
      </div>
    </a>
  }

  renderLibrariesHeader () {
    return <LibraryListHeader />
  }

  renderLibraries () {
    const dialogOption = (this.state.mode === Constants.library.mode.dialog) ? '?dialog=true' : ''

    return this.state.libraryChildren.map((child, index) => {
      const selected = (this.state.selected_data === child)
      return <LibraryList libraryChild={child} selected={selected}
                          onClick={(e, library) => this.onClickLibrary(e,
                            library)}
                          href={'/folders/' + child.uuid + dialogOption} />
    })
  }

  renderEmptyState () {
    return <EmptyState
      icon={'inbox'}
      title={'ライブラリが空です'}
      description={'表示できるファイルがありません'}>
    </EmptyState>
  }

  onClickLibrary (
    e: SyntheticInputEvent<EventTarget>, library: LibraryListDataType) {
    console.log(library)
    this.setState({selected_data: library})
  }

  isEmptyLibraryList () {
    if (!this.state.is_finished) {
      return false
    }
    if (!Array.isArray(this.state.libraryChildren) ||
      this.state.libraryChildren.length ===
      0 || this.state.libraryChildren === null) {
      return true
    }
    return false
  }

  onClickDelete (selected_data: LibraryListDataType) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.deleteLibraryChild(selected_data)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        {selected_data.label} を削除しますか？
      </div>,
    })
  }

  deleteLibraryChild (selected_data: LibraryListDataType) {
    this.setState({is_loading: true})
    this.deleteLibraryListData(selected_data.type, selected_data.uuid).then((response) => {
      this.setState({is_loading: false})
      if (!response.data.success) {
        this.props.notify({
          title: '削除エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
      }
      if (response.data.success) {
        this.props.notify({
          title: '削除しました',
          message: selected_data.label + 'を削除しました',
          status: 'success'
        })
        this.fetchFolder()
      }
    })
  }

  deleteLibraryListData (type: string, uuid: string) {
    switch (type) {
      case Constants.library.type.frame:
        return APIUtil.delete('frames/' + uuid) //TODO このエンドポイントは無い
      case Constants.library.type.document:
        return APIUtil.delete('documents/' + uuid)
      case Constants.library.type.folder:
        return APIUtil.delete('folders/' + uuid)
      case Constants.library.type.database:
        return APIUtil.delete('databases/' + uuid)
      case Constants.library.type.remoteFolder:
        return APIUtil.delete('remote-folders/' + uuid)
    }
  }

  renderInspector () {
    const data: LibraryListDataType = this.state.selected_data
    let onClickDelete = null
    let onClickApply = null

    switch (this.state.mode) {
      case Constants.library.mode.dialog:
        if (data && data.type === Constants.library.type.frame) {
          onClickApply = (data) => this.onClickApply(
            data)
        }
        break
      case Constants.library.mode.list:
        onClickDelete = (data) => this.onClickDelete(
          data)
        break
    }

    return <LibraryInspector data={data}
                             onClickDelete={onClickDelete}
                             onClickApply={onClickApply}
                             onBlurTitle={(e) => this.onBlurTitle(e,
                               data)} />
  }

  onClickApply (selected_data: LibraryListDataType) {
    if (window.opener || !window.opener.closed) {
      window.opener.onCallbackApply(selected_data)
    }
    window.close()
  }

  renderBreadCrumb () {
    if (Array.isArray(this.state.folderPath)) {
      return <BreadCrumb history={this.makeHistory(this.state.folderPath)} />
    }
    return null
  }

  makeHistory (folderPath: []): [BreadCrumbHistoryType] {
    const dialogOption = (this.state.mode === Constants.library.mode.dialog) ? '?dialog=true' : ''

    const history = folderPath.map((path, index) => {
      return {
        id: path.uuid,
        label: path.label,
        url: this.makeLibraryURL(path.uuid) + dialogOption,
        current: ((folderPath.length - 1) === index)
      }
    })
    return history
  }

  makeLibraryURL (uuid: string): string {
    return '/folders/' + uuid
  }

  onBlurTitle (
    e: SyntheticInputEvent<EventTarget>, selected_data: LibraryListDataType) {
    const newLibraryChildren = this.state.libraryChildren.map((child) => {
      if (selected_data.uuid === child.uuid) {
        child.label = e.target.value
        return child
      }
    })
    this.setState({
      libraryChildren: newLibraryChildren,
    })
  }

  renderAll () {
    if (!this.state.is_finished) {
      return null
    }
    if (this.isEmptyLibraryList() && this.state.mode === Constants.library.mode.dialog) {
      return this.renderEmptyState()
    }

    let newUI = <div>
      {this.renderNewFolder()}
      {/*{this.renderNewDocument()}*/}
      {this.renderNewFrame()}
    </div>

    return <div>
      {this.renderBreadCrumb()}
      {this.renderLibrariesHeader()}
      {this.renderLibraries()}
      {this.renderInspector()}
      {(this.state.mode === Constants.library.mode.list) ? newUI : null}
      {/*{this.renderNewDatabase()}*/}
      {/*{this.renderNewRemoteFolder()}*/}
    </div>
  }

  render () {
    return <div className={style.inspector_list_container}>
      <div className={'container mt-40px'}>
        <Loader center={true} absolute={true} visible={this.state.is_loading} />
        {this.renderAll()}
        <ModalManager />
        <NotificationManager />
      </div>
    </div>
  }
}