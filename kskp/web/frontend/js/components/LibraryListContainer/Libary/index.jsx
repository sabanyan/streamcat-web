//@flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import libraryListStyle from 'Shared/ListRow/LibraryListRow/style.scss'
import { ModalManager } from 'Shared/Modal'
import { BreadCrumb, EmptyState, Loader } from 'Shared/Base'
import { LibraryInspector, ParamsForm } from 'Shared/Inspector'
import { NotificationManager } from 'Shared/Notification'
import { APIUtil, ErrorUtil, HttpUtil, ModalUtil, ReactDomUtil } from 'Utils/index'
import { LibraryListHeader, LibraryListRow } from 'Shared/ListRow'
import Constants from 'Constants/index'
import { FileUploader, TextField } from 'Shared/Input'
import type { BreadCrumbHistoryType, LibraryListDataType, UploadedFileType } from 'Types/index'
import type { LibraryProps } from 'LibraryListContainer/index'
import { VisualizeModel } from "Model/index";
import { LocksModel } from 'Model/index'
import axios from 'axios'

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
  visualizers: [];
}

type Database = {
  label: stirng;
  DBMS: string;
  host: string;
  port: string;
  database: string;
  user_id: string;
  user_password: stirng;
}

export default class Library extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)

    const is_dialog = HttpUtil.getURLParam("dialog") ? true : false 
    const mode = HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list
    
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
      is_dialog: is_dialog,
      database:this.getIntialDatabase(),
      edit_databse:this.getIntialDatabase(),
      mode: mode,
    }
    
    // window.visualizersに保存していたはずのvisualizersがなくなる場合があるため、再取得
    APIUtil.get('visualizers').then((response) => {
      const json = response.data
      const visualizers = json.data.map((visualize)=>{
        return new VisualizeModel(visualize)
      })
      this.setState({
        visualizers: visualizers
      })
    })
  }

  getIntialDatabase() {
    return {
      dbms:this.getDataBaseParams()[1].default,
      database:"",
      user_id:"",
      password:""
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
          alert('資料名を入力してくsださい')
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
          this.setState({document_name:null, upload_file: null}, () => {
            ModalUtil.closeModal(Constants.modal.ADD_DOCUMENT)
          })
        }, () => {
          this.unhandledNotify()
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
          this.setState({folder_name: null}, () => {
            ModalUtil.closeModal(Constants.modal.ADD_FOLDER)
          })    
        }, () => {
          this.unhandledNotify('フォルダ作成エラー')
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
          this.setState({frame_name:null, upload_file: null}, () => {
            ModalUtil.closeModal(Constants.modal.ADD_FRAME)
          })
        }, () => {
          this.unhandledNotify('アップロードエラー')
        })
      },
    })
    ModalUtil.registerModal({
      id: Constants.modal.ADD_DATABASE, onClickDone: () => {
        try {
          const database = this.state.database
          if (!database.label) {
            alert("Labelを入力してください")
            return
          }
          if (!database.dbms) {
            alert("DBMSを入力してください")
            return
          }
          if (!database.hostname) {
            alert("ホスト名を入力してください")
            return
          }
          if (!database.port) {
            alert("ポート名を入力してください")
            return
          }
  
          const body = {
            label:this.state.database.label,
            parent:this.state.currentFolderUUID,
            dbms:this.state.database.dbms,
            hostname:this.state.database.hostname,
            port:Number(this.state.database.port),
            database:this.state.database.database,
            user_id:this.state.database.user_id,
            password:this.state.database.password
          }
          APIUtil.post('databases', body).then((response) => {
            this.completeAddedDatabase(response)
          }, () => {
            this.unhandledNotify('データベース作成エラー')
          })
        } catch (e) {
          console.log(e)
        }
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

  completeAddedDatabase (response: any) {
    const json = response.data.data
    if (!response.data.success) {
      this.props.notify({
        title: 'データベース作成エラー',
        message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
        status: 'error',
        dismissAfter: 0,
        closeButton: true
      })
    } else {
      this.props.notify({
        title: 'データベースを作成しました',
        message: this.state.database.label + 'を作成しました',
        status: 'success'
      })
    }
    this.setState({
        is_loading: false, 
        database:this.getIntialDatabase()
      }, () => {
      ModalUtil.closeModal(Constants.modal.ADD_DATABASE)
      this.fetchFolder()
    })
    
  }

  completeEditDatabase (response: any) {
    const json = response.data.data
    if (!response.data.success) {
      this.props.notify({
        title: 'データベース作成エラー',
        message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
        status: 'error',
        dismissAfter: 0,
        closeButton: true
      })
    } else {
      this.props.notify({
        title: 'データベースを編集しました', message: this.state.database.label + 'を編集しました',
        status: 'success'
      })
    }
    this.setState({
        is_loading: false, 
        edit_database:this.getIntialDatabase()
      }, () => {
      ModalUtil.closeModal(Constants.modal.EDIT_DATABASE)
      this.fetchFolder()
    })
    
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
      let defaultFileName = uploadFile.name.split('.')[0]
      this.setState({
        upload_file: {
          file: uploadFile,
        },
        frame_name: defaultFileName
      }, () => {
        if (uploadFile && uploadFile.name) {
          ModalUtil.emitModal({
            id: Constants.modal.ADD_FRAME,
            visible: true,
            done: '追加する',
            content: <div>
              <TextField  key={uploadFile.name} placeholder={'名称'} defaultValue={defaultFileName} onChange={(e, validation) => this.onChangeFrameName(e, validation)} />
              <div className={'mt-8px'} />
              <FileUploader accept={['text/csv']} onChangeFile={(e) => this.onChangeFile(e)} />
            </div>,
          })
        }
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
        } else {
          APIUtil.get('awss3s/' + inject_folder_uuid).then((response) => {
            const json = response.data.data
            if (response.data.success) {
              this.setState({
                libraryChildren: json.children,
                folderPath: json.folderPath,
                currentFolderUUID: inject_folder_uuid,
              })
            }
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
        <TextField placeholder={'名称'} onChange={(e, validation) => this.onChangeFrameName(e, validation)} />
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
        <TextField placeholder={'フォルダ名'} onChange={(e, validation) => this.onChangeFolderName(e,validation)} />
      </div>,
    })
    e.preventDefault()
  }

  onChangeDatabase(e, param, value) {
    try {
      let database = this.state.database
      database[param.name] = value
      this.setState({
        database:database
      }, () => {
        const params = this.getDataBaseParams()
        const rules = this.getDataBaseRules()
        const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules}  onChange={(e, param, value) => this.onChangeDatabase(e, param, value)}></ParamsForm>
        ModalUtil.emitModal({
          id: Constants.modal.ADD_DATABASE,
          visible: true,
          done: '追加する',
          dynamic: true,
          content: paramsForm,
        })
      })
    } catch(e) {
      console.log(e)
    }
  }

  getDataBaseRules() {
    const rules = {
      "label" : {
        "presence":{"allowEmpty": false}
      },
      "dbms"  : {
        "presence":{"allowEmpty": false}
      },
      "hostname"  : {
        "presence":{"allowEmpty": false}
      },
      "port"  : {
        "presence":{"allowEmpty": false}
      }
    }
    return rules
  }
  getDataBaseParams() {
    const params = [
      {
        "name": "label",
        "type": "string",
        "label": "Label"
      },
      {
        "name": "dbms",
        "type": "select",
        "label": "DBMS",
        "options":{
          "labels": ["PostgreSQL", "ORACLE"],
          "values": ["postgresql", "oracle"]
        },
        "default": "postgresql"
      },
      {
        "name": "hostname",
        "type": "string",
        "label": "ホスト名",
        "default": ""
      },
      {
        "name": "port",
        "type": "number",
        "label": "ポート番号",
        "default": ""
      },
      {
        "name": "database",
        "type": "string",
        "label": "データベース名",
        "default": ""
      },
      {
        "name": "user_id",
        "type": "string",
        "label": "ユーザID",
        "default": ""
      },
      {
        "name": "password",
        "type": "string",
        "label": "パスワード",
        "default": ""
      }    
    ]
    
    return params
  }

  onClickNewDatabase (e: SyntheticInputEvent<EventTarget>) {
    const params = this.getDataBaseParams()
    let database = {}
    params.map(param => {
      if (param.default) database[param.name] = param.default
    })
    const rules = this.getDataBaseRules()
    this.setState({
      database : database
    }, () => {
      const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules}  onChange={(e, param, value) => this.onChangeDatabase(e, param, value)}></ParamsForm>
    
      ModalUtil.emitModal({
        id: Constants.modal.ADD_DATABASE,
        visible: true,
        done: '追加する',
        dynamic: true,
        content: paramsForm,
      })
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

  onClickSelectDestination (e) {
    if (window.opener || !window.opener.closed) {
      window.opener.onCallbackApply(this.state.currentFolderUUID)
    }
    window.close()
  }

  renderNewFolder () {
    return this.renderButton((e) => this.onClickNewFolder(e), 'フォルダを作成する', 'add_circle_outline')
  }

  renderNewDatabase () {
    return this.renderButton((e) => this.onClickNewDatabase(e), 'データベースを追加する', 'add_circle_outline')
  }

  renderNewDocument () {
    return this.renderButton((e) => this.onClickNewDocument(e), '資料をアップロードする', 'add_circle_outline')
  }

  renderNewFrame () {
    return this.renderButton((e) => this.onClickNewFrame(e), 'CSVをアップロードする', 'add_circle_outline')
  }

  renderNewRemoteFolder () {
    return this.renderButton((e) => this.onClickNewRemoteFolder(e), 'ファイルサーバを追加する', 'add_circle_outline')
  }

  renderSelectDestination () {
    return this.renderButton((e) => this.onClickSelectDestination(e), '移動する', 'input')
  }

  renderButton (onClick: Function, title: string, icon: string) {
    return <a
      className={classnames(libraryListStyle.library, libraryListStyle.new)}
      href="#" onClick={(e) => onClick(e)}>
      <div className={libraryListStyle.library_list}>
        <div className={libraryListStyle.name}>
          <i className={classnames('material-icons', [libraryListStyle.icon])}>{icon}</i>
          {title}
        </div>
      </div>
    </a>
  }
  

  renderLibrariesHeader () {
    return <LibraryListHeader />
  }

  renderLibraries () {
    let dialogOption = (this.state.is_dialog) ? '?dialog=true' + '&mode=' + this.state.mode : ''
    let renderLibraries = []

    if (this.state.libraryChildren && Array.isArray(this.state.libraryChildren)) {
      this.state.libraryChildren.forEach((child, index) => {
        // dialogで表示された場合(datasource追加、移動先選択など）は、ゴミ箱を表示しない
        if (child.type === Constants.library.type.trash && this.isDialog()) return
  
        const selected = (this.state.selected_data === child)
        let href = '/folders/' + child.uuid + dialogOption
        // ゴミ箱の場合、ゴミ箱専用のページに飛ぶ
        if (child.type === Constants.library.type.trash) href = '/trashes'
  
        const row = <LibraryListRow key={"LLR_" + index} libraryChild={child} selected={selected}
                            onClick={(e, library) => this.onClickLibrary(e, library)}
                            href={href} />
        renderLibraries.push(row)
      })
    }
    return renderLibraries
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
    let result = this.deleteLibraryListData(selected_data.type, selected_data.uuid)
    if (!result) return
    result.then((response) => {
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
      case Constants.library.type.flow:
        // FIX IT: Flowの削除 
        this.deleteFlow(uuid)
    }
  }

  deleteFlow(flow_uuid) {
    const {notify} = this.props
 
    // 1. LockIdを取得する。
    let body = {target: flow_uuid}
    let locks = new LocksModel(body)
    APIUtil.post('locks', body).then((response) => {
      let locksModel = locks.Parse(response)
      let lockId = locksModel.getLockId()
      if (lockId) {
        //APIUtil.delete('flows/' + flow_uuid, {lock:lockId})
        axios.delete('/api/v0/flows/' + flow_uuid,{data:{lock:lockId}})
        .then((response) => {
          APIUtil.post('delete-locks/' + lockId).then((response) => {
            this.fetchFolder()
          })
        }, (err) => {
          APIUtil.post('delete-locks/' + lockId).then((response) => {
            this.fetchFolder()
          })
        })
      } else {
        // lockが出来なかった場合
        notify({
          title: '削除エラー',
          message: locksModel.getErrorMessage(),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
      }
    })
  }

  editFlow(flow_uuid, parent_uuid) {
    const {notify} = this.props
    let body = {target: flow_uuid}
    let locks = new LocksModel(body)
    axios.post('/api/v0/locks', body).then((response) => {
      let locksModel = locks.Parse(response)
      let lockId = locksModel.getLockId()
      if (lockId) {
        axios.put('/api/v0/flows/' + flow_uuid, {
          parent: parent_uuid,
          lock  : lockId
        }).then((response) => {
          navigator.sendBeacon('/api/v0/delete-locks/' + lockId)
          this.fetchFolder()
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

  onClickMove (e) {
    const selected_data = this.state.selected_data
    try {
      HttpUtil.windowOpen('library?dialog=true&mode=folder_select', (folder_uuid) => {
        const type = selected_data.type
        const uuid = selected_data.uuid
        const data = {
          parent : folder_uuid
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
          if (response.data.success) {
            this.fetchFolder()
          } else {
            this.props.notify({
              title: "ライブラリー移動エラー",
              message: response.data.message,
              status: 'error',
              dismissAfter: 0,
              closeButton: true
            })
          }
        })
      })
    } catch(e) {
      console.log(e)
    }
  }

  onClickCleanTrash(data) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        APIUtil.delete('trashes').then((response) => {
         if (response.data.success !== true) throw response.data
          this.fetchFolder()
        }).catch(e => {
          this.props.notify({
            title: 'ゴミ箱エラー',
            message: e.message,
            status: 'error',
            dismissAfter: 0,
            closeButton: true
          })
        })
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: 'ゴミ箱を空にする',
      danger: true,
      content: <div>
        ゴミ箱を空にしますか？
      </div>,
    })

  }

  renderInspector () {
    const {notify, dissmissNotify} = this.props
    const data: LibraryListDataType = this.state.selected_data
    let onClickDelete = null
    let onClickApply = null
    let onClickMove = null
    let onClickEdit = null
    let onClickCleanTrash = null

    switch (this.state.mode) {
      // データソース追加時
      case Constants.library.mode.frame_select:
        if (data && data.type === Constants.library.type.frame) {
          onClickApply = (data) => this.onClickApply(data)
        }
        break
      // 移動させる時
      case Constants.library.mode.folder_select: 
        break
      // librayList
      case Constants.library.mode.list:
        if (data && data.type === Constants.library.type.trash) {
          onClickCleanTrash = (data) => this.onClickCleanTrash(data)
        } else {
          onClickDelete = (data) => this.onClickDelete(data)
          onClickMove = (data) => this.onClickMove(data)
          if (data && data.type === Constants.library.type.database) {
            onClickEdit = (data) => this.onClickEditDatabase(data)
          }
        }

        break
    }
    return <LibraryInspector data={data}
                             onClickDelete={onClickDelete}
                             onClickApply={onClickApply}
                             onClickMove={onClickMove}
                             onClickEdit={onClickEdit}
                             onClickCleanTrash={onClickCleanTrash}
                             onBlurTitle={(e) => this.onBlurTitle(e,data)}
                             visualizers={this.state.visualizers}
                             notify={notify}
                             dissmissNotify={dissmissNotify}
                             />
  }

  onClickApply (selected_data: LibraryListDataType) {
    if (window.opener || !window.opener.closed) {
      window.opener.onCallbackApply(selected_data)
    }
    window.close()
  }

  onClickEditDatabase (data) {
    if (data.type !== Constants.library.type.database) {
      return
    }
    const rules = this.getDataBaseRules()
    const params = this.getDataBaseParams()
    this.setState({
      database: {
        "label"   :data.label,
        "dbms"    :data.dbms,
        "hostname":data.hostname,
        "port"    :data.port,
        "database":data.database,
        "user_id" :data.user_id,
        "password":data.password
      }
    }, () => {
      const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules} onChange={(e, param, value) => this.onChangeEditDatabase(e,param,value)} ></ParamsForm>
      ModalUtil.registerModal({
        id: Constants.modal.EDIT_DATABASE, onClickDone: () => {
          this.editLibraryChild(data)
          ModalUtil.closeModal(Constants.modal.CONFIRM)
        },
      })
      ModalUtil.emitModal({
        id: Constants.modal.EDIT_DATABASE,
        visible: true,
        done: '編集する',
        danger: true,
        content: paramsForm
      })
    })
  }

  onChangeEditDatabase(e, param, value) {
    try {
      let database = this.state.database
      database[param.name] = value
      this.setState({
        database:database
      }, () => {
        const rules = this.getDataBaseRules()
        const params = this.getDataBaseParams()
        const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules} onChange={(e, param, value) => this.onChangeEditDatabase(e,param,value)} ></ParamsForm>
        ModalUtil.emitModal({
          id: Constants.modal.EDIT_DATABASE,
          visible: true,
          done: '編集する',
          danger: true,
          content: paramsForm
        })
      })
    } catch(e) {
      console.log(e)
    }
  }

  editLibraryChild(data) {
    APIUtil.put('databases/' + data.uuid, this.state.database).then((response) => {
      this.completeEditDatabase(response)
    }, () => {
      this.unhandledNotify('データベース修正エラー')
    })
  }

  renderBreadCrumb () {
    if (Array.isArray(this.state.folderPath)) {
      return <BreadCrumb history={this.makeHistory(this.state.folderPath)} />
    }
    return null
  }

  makeHistory (folderPath: []): [BreadCrumbHistoryType] {
    const dialogOption = (this.state.is_dialog) ? '?dialog=true' + '&mode=' + this.state.mode : ''

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
    // Label の修正
    if (!selected_data) {
      return
    }
    
    const uuid = selected_data.uuid
    const libraryType = selected_data.type

    let endPoint = this.getEndPoint(libraryType)

    if (!endPoint) {
      return
    }

    let body = {
      label : e.target.value,
    }
    if (selected_data.type === Constants.library.type.database) {
      body = {
        label : e.target.value,
        dbms : selected_data.dbms,
        hostname : selected_data.hostname,
        port : selected_data.port,
        database: selected_data.database,
        user_id: selected_data.user_id,
        password: selected_data.password
      }
    }
  
    APIUtil.put(endPoint + uuid, body).then((response) => {
      if (response.data.success) {
        
        const resultLabel = response.data.data.label
        let selected_data = this.state.selected_data

        if (!(this.state.libraryChildren)) {
          return
        }

        let updateLibrary = this.findLibrary(this.state.libraryChildren, uuid)
        
        if (!updateLibrary) {
          return
        }
        updateLibrary.label = resultLabel
        const newLibraryChildren = this.updateLibrary(this.state.libraryChildren, uuid, updateLibrary)
        
        if (selected_data) {
          selected_data = updateLibrary
        }
        
        this.setState({
          libraryChildren: newLibraryChildren,
          selected_data: selected_data
        },() => {
          this.forceUpdate()
        })  
      }
    })        
  }

  getEndPoint(libraryType:string) {
    let endPoint = null
    switch (libraryType) {
      case Constants.library.type.frame:
        endPoint = 'frames/'
        break
      case Constants.library.type.document:
        break
      case Constants.library.type.folder:
        endPoint = 'folders/'
        break
      case Constants.library.type.database:
        endPoint = 'databases/'
        break
      case Constants.library.type.remoteFolder:
        break

      default:
        break
    }

    return endPoint
  }

  updateLibrary(libraryChildren:[], uuid:string, library) {
    return libraryChildren.map((child) => {
      if (uuid === child.uuid) {
        return library  
      }
      return child
    })
  }

  findLibrary(libraryChildren:[], uuid:string) {
    return libraryChildren.find((child) => {return (child.uuid === uuid)})
  }

  isDialog () {
    return (HttpUtil.getURLParam('dialog'))
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
      {this.renderNewDatabase()}
    </div>

    let selectUI = <div>
      {this.renderSelectDestination()}
    </div>

    return <div>
      {this.renderBreadCrumb()}
      {this.renderLibrariesHeader()}
      {this.renderLibraries()}
      {this.renderInspector()}
      {(this.state.mode === Constants.library.mode.list) ? newUI : null}
      {(this.state.mode === Constants.library.mode.folder_select) ? selectUI : null}
      {/*{this.renderNewDatabase()}*/}
      {/*{this.renderNewRemoteFolder()}*/}
    </div>
  }

  render () {
    const {notify, dissmissNotify} = this.props

    let containerClassName = (this.isDialog()) ? 'container' : 'container mt-40px'
    return <div className={style.inspector_list_container}>
      <div className={containerClassName}>
        <Loader center={true} absolute={true} visible={this.state.is_loading} />
        {this.renderAll()}
        <ModalManager
          notify={notify}
          dissmissNotify={dissmissNotify}
        />
        <NotificationManager />
      </div>
    </div>
  }
}

