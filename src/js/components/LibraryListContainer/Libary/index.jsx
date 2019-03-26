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
import type {
  BreadCrumbHistoryType,
  LibraryListDataType,
  UploadedFileType,
} from '../../../types'
import BreadCrumb from '../../shared/BreadCrumb'

type Props = {}

type State = {
  stores: [];
  libraryChildren: [];
  folderPath: [];
  is_loading: boolean;
  is_finished: boolean;
  selected_data?: LibraryListDataType | null;
  currentFolderUUID: string;
  upload_file?: UploadedFileType | null;
}

export default class Library extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    //TODO ReduxのStoreで管理する
    this.state = {
      stores: [],
      libraryChildren: [],
      currentFolderUUID: '',//現在のフォルダのuuid
      is_loading: false,
      is_finished: false,
      selected_data: null,
      upload_file: null,
    }
  }

  componentDidMount () {
    const getStores = this.getStores()
    const getSubStores = this.getSubStores()
    Promise.all([getStores, getSubStores]).then(() => {
      this.setState({is_loading: false, is_finished: true})
    })
    this.registerModal()
  }

  registerModal () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FILE, onClickDone: () => {
        this.setState({is_loading: true, selected_data: null})
        const file = this.state.upload_file.file
        const fileName = '' //未使用
        const label = '新しいファイル'
        const parentUUID = this.state.currentFolderUUID
        APIUtil.frameUpload(file, fileName, label, parentUUID).
          then((response) => {
            const json = response.data.data
            this.setState({is_loading: false})
            ModalUtil.closeModal(Constants.modal.ADD_FILE)
          })
      },
    })
  }

  onChangeFile (e: SyntheticInputEvent<EventTarget>) {
    console.log(e)
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
  getSubStores () {
    if (inject_folder_uuid) {
      //該当フォルダを取得
      return APIUtil.get('folders/' + inject_folder_uuid).then((response) => {
        const json = response.data.data
        this.setState({
          libraryChildren: json.children,
          folderPath: json.folderPath,
          currentFolderUUID: inject_folder_uuid,
        })
      })
    }
    else {
      //ルートを取得
      return APIUtil.get('library').then((response) => {
        const json = response.data.data
        this.setState({
          libraryChildren: json.children,
          folderPath: json.folderPath,
          currentFolderUUID: json.uuid,
        })
      })
    }
//    APIUtil.get('folders/2c792bbc-4679-4396-96d1-94fc023073b1').then((response)
// => { console.log(response); })
// APIUtil.get('folders/61f70b75-46ac-4716-ae8d-c0c895775745').then((response)
// => { console.log(response); })
// APIUtil.get('databases/4C545611-4569-4CD5-800E-55BE69CF8BA8').then((response)
// => { console.log(response); })
  }

  onClickNewFile (e: SyntheticInputEvent<EventTarget>) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FILE,
      visible: true,
      done: '追加する',
      content: <div>
        <FileUploader accept={['text/csv']} defaultLabel={'ファイルを選択してください'}
                      onChangeFile={(e) => this.onChangeFile(e)}/>
      </div>,
    })
    e.preventDefault()
  }

  onClickNewFolder (e: SyntheticInputEvent<EventTarget>) {
    this.setState({is_loading: true, selected_data: null})
    const body = {
      'label': '新しいフォルダ',
      'parent': this.state.currentFolderUUID,
    }
    APIUtil.post('folders', body).then((response) => {
      const json = response.data.data
      this.setState({is_loading: false})
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

  renderNewFile () {
    return this.renderNew((e) => this.onClickNewFile(e), 'ファイルをアップロードする')
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
    return <LibraryListHeader/>
  }

  renderLibraries () {
    return this.state.libraryChildren.map((child, index) => {
      const selected = (this.state.selected_data === child)
      return <LibraryList libraryChild={child} selected={selected}
                          onClick={(e, library) => this.onClickLibrary(e,
                            library)}
                          href={'/folders/' + child.uuid}/>
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
    this.deleteLibraryListData(selected_data.type, selected_data.uuid)
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
    return <LibraryInspector data={data}
                             onClickDelete={(selected_data) => this.onClickDelete(
                               selected_data)}
                             onBlurTitle={(e) => this.onBlurTitle(e,
                               data)}/>
  }

  renderBreadCrumb () {
    if(Array.isArray(this.state.folderPath)){
      return <BreadCrumb history={this.makeHistory(this.state.folderPath)}/>
    }
    return null
  }

  makeHistory(folderPath:[]):[BreadCrumbHistoryType]{
    const history = folderPath.map((path,index)=>{
      return {
        id: path.uuid,
        label: path.label,
        url: this.makeLibraryURL(path.uuid),
        current: ((folderPath.length-1) === index )
      }
    })
    return history
  }

  makeLibraryURL(uuid:string):string{
    return "/folders/"+uuid
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
//    if (this.isEmptyLibraryList()) {
//      return this.renderEmptyState()
//    }
    if (!this.state.is_finished) {
      return null
    }
    return <div>
      {this.renderBreadCrumb()}
      {this.renderLibrariesHeader()}
      {this.renderLibraries()}
      {this.renderInspector()}
      {this.renderNewFolder()}
      {this.renderNewFile()}
      {this.renderNewDatabase()}
      {this.renderNewRemoteFolder()}
    </div>
  }

  render () {
    return <div className={style.inspector_list_container}>
      <div className={'container mt-40px'}>
        <Loader center={true} absolute={true} visible={this.state.is_loading}/>
        {this.renderAll()}
        <ModalManager/>
        <NotificationManager/>
      </div>
    </div>
  }
}