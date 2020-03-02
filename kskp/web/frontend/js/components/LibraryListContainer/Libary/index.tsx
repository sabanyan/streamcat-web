import * as React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import libraryListStyle from 'Shared/ListRow/LibraryListRow/style.scss'
import { ModalManager } from 'Components/shared/Modal'
import { BreadCrumb, EmptyState, Loader } from 'Shared/Base'
import { LibraryInspector, ParamsForm } from 'Shared/Inspector'
import { NotificationManager } from 'Shared/Notification'
import { APIUtil, ErrorUtil, HttpUtil, ModalUtil, ReactDomUtil } from 'Utils/index'
import { LibraryListHeader, LibraryListRow } from 'Shared/ListRow'
import Constants from 'Constants/index'
import { FileUploader, UploadFile, TextField } from 'Shared/Input'
import { BreadCrumbHistoryType, LibraryListDataType, UploadedFileType } from 'Types/index'
import { LibraryProps } from 'LibraryListContainer/index'
import { VisualizeModel, LibraryChild, MessageModel } from 'Model/index';
import { LocksModel } from 'Model/index'
import axios from 'axios'

import Queue from 'promise-queue-plus'
import { API } from 'Modules/api/index'

import List from 'Shared/Container/List/index'
import IconRender from 'Shared/IconRenderer/index'

type Props = LibraryProps

type State = {
  stores: any[];
  libraryChildren: LibraryChild[];
  folderPath: any[];
  is_loading: boolean;
  is_finished: boolean;
  selected_data?: any;
  selectedDatas: LibraryChild[];
  lastSelected: LibraryChild | null;
  currentFolderUUID: string;

  // database
  database: Database;
  edit_database: Database;

  // mode
  mode: string;
  is_dialog: boolean;

  // visualizers
  visualizers: any[];

  // new
  upload_files: FileList | null; // 単一アップロードの場合（database, folder）、0番目のindexが対象
  new_names: string[] // 単一アップロードの場合（database, folder）、0番目のindexがが対象

  // search
  searchText: string;
}

type Database = {
  label?: string;
  dbms?: any;
  host?: string;
  port?: string;
  database?: string;
  user_id?: string;
  user_password?: string;
}

export default class Library extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)

    this.onClickLibrary = this.onClickLibrary.bind(this)
    this.getColumns = this.getColumns.bind(this)
    this.deleteLibrary = this.deleteLibrary.bind(this)
    this.moveLibrary = this.moveLibrary.bind(this)
    this.setState = this.setState.bind(this)
    this.fetchFolder = this.fetchFolder.bind(this)

    const is_dialog: boolean = HttpUtil.getURLParam("dialog") ? true : false
    const mode = HttpUtil.getURLParam("mode") ? HttpUtil.getURLParam("mode") : Constants.library.mode.list

    //TODO ReduxのStoreで管理する
    this.state = {
      stores: [],
      libraryChildren: [],
      folderPath: [],
      is_loading: false,
      is_finished: false,
      selected_data: null,
      selectedDatas: [],
      lastSelected: null,
      currentFolderUUID: '',//現在のフォルダのuuid

      // database
      database: this.getInitialDatabase(),
      edit_database: this.getInitialDatabase(),

      // mode
      is_dialog: is_dialog,
      mode: mode,

      // visualizers
      visualizers: [],

      // new
      upload_files: null, // frame 複数アップロードのため
      new_names: [],

      // search
      searchText: ""
    }

    // window.visualizersに保存していたはずのvisualizersがなくなる場合があるため、再取得
    APIUtil.get('visualizers').then((response) => {
      const json = response.data
      const visualizers = json.data.map((visualize) => {
        return new VisualizeModel(visualize)
      })
      this.setState({
        visualizers: visualizers
      })
    })
  }

  getInitialDatabase(): Database {
    return {
      label: "",
      dbms: this.getDataBaseParams()[1].default,
      host: "",
      port: "",
      database: "",
      user_id: "",
      user_password: ""
    }
  }

  componentDidMount() {
    this.fetchFolder()
    this.registerModal()
  }

  fetchFolder() {
    const getStores = this.getStores()
    const getFolderChildren = this.getFolderChildren()
    Promise.all([getStores, getFolderChildren]).then(() => {
      this.setState({ is_loading: false, is_finished: true })
    })
  }

  registerModal() {
    //モーダル処理の登録

    // Folder
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FOLDER, onClickDone: () => {
        if (this.state.new_names.length === 0) {
          alert('ファルダ名を入力してください')
          ModalUtil.closeModal(Constants.modal.ADD_FOLDER)
          return
        }
        this.setState({ is_loading: true, selected_data: null })
        const body = {
          'label': this.state.new_names[0],
          'parent': this.state.currentFolderUUID,
        }
        APIUtil.post('folders', body).then((response) => {
          this.completeAddedFolder(response)
          this.setState({ new_names: [] }, () => {
            ModalUtil.closeModal(Constants.modal.ADD_FOLDER)
          })
        }, () => {
          this.unhandledNotify('フォルダ作成エラー')
        })
      }
    })

    // CSV Upload
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FRAME, onClickDone: () => {
        if (this.state.new_names.length === 0) {
          alert('名称を入力してください')
          return
        }
        if (!this.state.upload_files) {
          alert('ファイルを選択してください')
          return
        }

        this.setState({ is_loading: true, selected_data: null }, () => {
          const files: FileList | null = this.state.upload_files
          const new_names: string[] = this.state.new_names
          const parentUUID = this.state.currentFolderUUID
          APIUtil.frameUpload(files, new_names, new_names, parentUUID)
            .then((response) => {
              console.log(response)
              //this.completeUploaded(response)
            }, () => {
              //this.unhandledNotify('アップロードエラー')
            })
            .then(() => {
              this.setState({
                is_loading: false,
                upload_files: null,
                new_names: []
              }, () => {
                ModalUtil.closeModal(Constants.modal.ADD_FRAME)
              })
            })
        })
      },
    })

    // Database Upload
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
          if (!database.host) {
            alert("ホスト名を入力してください")
            return
          }
          if (!database.port) {
            alert("ポート名を入力してください")
            return
          }

          const body = {
            label: this.state.database.label,
            parent: this.state.currentFolderUUID,
            dbms: this.state.database.dbms,
            hostname: this.state.database.host,
            port: Number(this.state.database.port),
            database: this.state.database.database,
            user_id: this.state.database.user_id,
            password: this.state.database.user_password
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

  unhandledNotify(title: string) {
    this.setState({ is_loading: false })
    this.props.notify({
      title: title,
      message: Constants.errorMessage.unhandledError,
      status: 'error',
      dismissAfter: 0,
      closeButton: true
    })
  }

  completeAddedFolder(response: any) {
    const json = response.data.data
    this.setState({ is_loading: false })
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
        message: this.state.new_names[0] + 'を作成しました',
        status: 'success'
      })
    }
    this.fetchFolder()
  }

  completeAddedDatabase(response: any) {
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
      database: this.getInitialDatabase()
    }, () => {
      ModalUtil.closeModal(Constants.modal.ADD_DATABASE)
      this.fetchFolder()
    })

  }

  completeEditDatabase(response: any) {
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
      edit_database: this.getInitialDatabase()
    }, () => {
      ModalUtil.closeModal(Constants.modal.EDIT_DATABASE)
      this.fetchFolder()
    })

  }

  completeUploaded(response: any) {
    const json = response.data.data
    const success = response.data.success
    this.setState({ is_loading: false })

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
        message: this.state.new_names.join(",") + 'をアップロードしました',
        status: 'success'
      })
    }
    this.fetchFolder()
  }

  onChangeFile(e: React.ChangeEvent<HTMLInputElement>) {
    let selectedFiles: FileList | null = e.target.files
    if (selectedFiles) {
      this.setState({
        upload_files: selectedFiles
      }, () => {
        ModalUtil.emitModal({
          id: Constants.modal.ADD_FRAME,
          visible: true,
          done: 'アップロード',
          content: <div>
            <FileUploader accept={['text/csv']}
              selectedFiles={selectedFiles}
              onChangeFile={(e) => this.onChangeFile(e)} multiple={true}
              onChangeNames={(names) => this.onChangeFrameName(names)} />
          </div>,
        })
      })
    }
  }

  onUploadFrame(uploadFiles: UploadFile[]) {

  }

  //storesの取得処理
  getStores() {
    return APIUtil.get('stores').then((response) => {
      const json = response.data.data
      this.setState({ stores: json.stores })
    })
  }

  //libraryの取得処理
  getFolderChildren() {
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

  onChangeFrameName(names: string[]) {
    this.setState({
      new_names: names
    })
  }

  onChangeFolderName(e: React.ChangeEvent<HTMLInputElement>, validation) {
    let new_names = this.state.new_names
    new_names[0] = e.target.value

    this.setState({
      new_names: new_names
    })
  }

  onClickNewFrame(e: React.ChangeEvent<HTMLInputElement>) {
    const { notify } = this.props
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FRAME,
      visible: true,
      done: 'アップロード',
      content: <div>
        <FileUploader accept={['.csv']} url={'api/v0/frames'} parentUUID={this.state.currentFolderUUID} notify={notify} />
      </div>,
    })
    e.preventDefault()
  }

  onClickNewFolder(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      new_names: [""]
    }, () => {
      ModalUtil.emitModal({
        id: Constants.modal.ADD_FOLDER,
        visible: true,
        done: '追加する',
        content: <div>
          <TextField placeholder={'フォルダ名'} onChange={(e, validation) => this.onChangeFolderName(e, validation)} />
        </div>,
      })
    })
    e.preventDefault()
  }

  onChangeDatabase(e: React.ChangeEvent<HTMLInputElement>, param, value) {
    try {
      let database = this.state.database
      database[param.name] = value
      this.setState({
        database: database
      }, () => {
        const params = this.getDataBaseParams()
        const rules = this.getDataBaseRules()
        const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules} onChange={(e, param, value) => this.onChangeDatabase(e, param, value)}></ParamsForm>
        ModalUtil.emitModal({
          id: Constants.modal.ADD_DATABASE,
          visible: true,
          done: '追加する',
          dynamic: true,
          content: paramsForm,
        })
      })
    } catch (e) {
      console.log(e)
    }
  }

  getDataBaseRules() {
    const rules = {
      "label": {
        "presence": { "allowEmpty": false }
      },
      "dbms": {
        "presence": { "allowEmpty": false }
      },
      "hostname": {
        "presence": { "allowEmpty": false }
      },
      "port": {
        "presence": { "allowEmpty": false }
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
        "options": {
          "labels": ["PostgreSQL", "ORACLE"],
          "values": ["postgresql", "oracle"]
        },
        "default": "postgresql"
      },
      {
        "name": "host",
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
        "name": "user_password",
        "type": "string",
        "label": "パスワード",
        "default": ""
      }
    ]

    return params
  }

  onClickNewDatabase(e: React.MouseEvent<HTMLInputElement>) {
    const params = this.getDataBaseParams()
    let database: Database = {}
    params.map(param => {
      if (param.default) database[param.name] = param.default
    })
    const rules = this.getDataBaseRules()
    this.setState({
      database: database
    }, () => {
      const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules} onChange={(e, param, value) => this.onChangeDatabase(e, param, value)}></ParamsForm>

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

  onClickNewRemoteFolder(e: React.MouseEvent<HTMLInputElement>) {
    this.setState({ is_loading: true, selected_data: null })
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
      this.setState({ is_loading: false })
    })
    e.preventDefault()
  }

  onClickSelectDestination(e: React.MouseEvent<HTMLInputElement>) {
    if (window.opener || !window.opener.closed) {
      window.opener.onCallbackApply(this.state.currentFolderUUID)
    }
    window.close()
  }

  isEmptyLibraryList() {
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

  async deleteLibrary(library: LibraryChild, lock: { uuid: string | null }) {
    const { notify } = this.props

    return new Promise(async (resolve, reject) => {
      // Lockが必要なライブラリー(flow)の場合は、Lockを取得する
      if (library.type === Constants.library.type.flow) {
        await API.request.doPost.locks({ flowUUID: library.uuid })
          .then((res) => {
            if (!res.data.success) throw res.data
            lock.uuid = API.response.post.locks(res).uuid
          })
          .catch((e) => {
            console.log(e)
            reject(e)
          })
      }

      // Libraryを削除する
      await API.request.doDelete.library({
        libraryUUID: library.uuid,
        libraryType: library.type,
        lockUUID: lock.uuid
      })
        .then((res) => {
          if (!res.data.success) throw res.data
        })
        .catch((e) => {
          console.log(e)
          reject(e)
        })

      // Lockを取得した場合、Lockを解除する
      if (lock.uuid) {
        await API.request.doDelete.locks({ lockUUID: lock.uuid })
          .then((res) => {
            lock.uuid = null
            if (!res.data.success) throw res.data
          })
          .catch((e) => {
            console.log(e)
            reject(e)
          })
      }
      resolve()
    })
      .then(() => {
        // 成功
        notify({
          title: '',
          message: library.label + 'を削除しました',
          status: 'success'
        })
      })
      .catch((e) => {
        // エラー
        notify({
          title: "ライブラリー削除エラー(" + library.label + ")",
          message: e.message,
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
      })
  }

  onClickDelete() {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        const selectedDatas = this.state.selectedDatas

        let queue = Queue(
          1, // concurrency
          {
            "retry": 0               //Number of retries
            , "retryIsJump": false     //retry now? 
            , "timeout": 0            //The timeout period
          }
        )
        let lock = { uuid: null }
        this.setState({
          is_loading: true
        }, () => {
          selectedDatas.forEach((selectedData: LibraryChild) => {
            queue.push(this.deleteLibrary, [selectedData, lock])
          })
          queue.push(this.setState, [{ is_loading: false }])
          queue.push(this.fetchFolder, [])
          queue.start()
        })
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    let targets:string[] = []
    this.state.selectedDatas.forEach((data) => {
      targets.push(data.label)
    })

    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        {targets.join(",")} を削除しますか？
      </div>,
    })
  }

  async moveLibrary(library: LibraryChild, parentFolderUUID: string, lock: { uuid: string | null }) {
    const { notify } = this.props

    return new Promise(async (resolve, reject) => {
      // Lockが必要なライブラリー(flow)の場合は、Lockを取得する
      if (library.type === Constants.library.type.flow) {
        await API.request.doPost.locks({ flowUUID: library.uuid })
          .then((res) => {
            if (!res.data.success) throw res.data
            lock.uuid = API.response.post.locks(res).uuid
          })
          .catch((e) => {
            console.log(library)
            console.log(e)
            reject(e)
          })
      }

      // Libraryを移動させる
      await API.request.doPut.library({
        parentUUID: parentFolderUUID,
        libraryUUID: library.uuid,
        libraryType: library.type,
        lockUUID: lock.uuid
      })
        .then((res) => {
          if (!res.data.success) throw res.data
        })
        .catch((e) => {
          console.log(library)
          console.log(e)
          reject(e)
        })

      // Lockを取得した場合、Lockを解除する
      if (lock.uuid) {
        await API.request.doDelete.locks({ lockUUID: lock.uuid })
          .then((res) => {
            lock.uuid = null
            if (!res.data.success) throw res.data
          })
          .catch((e) => {
            console.log(library)
            console.log(e)
            reject(e)
          })
      }
      resolve()
    })
      .then(() => {
        // 成功
      })
      .catch((e) => {
        // 例外
        notify({
          title: "ライブラリー移動エラー(" + library.label + ")",
          message: e.message,
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
      })
  }

  onClickMove() {
    const selectedDatas = this.state.selectedDatas

    let queue = Queue(
      1, // concurrency
      {
        "retry": 0               //Number of retries
        , "retryIsJump": false     //retry now? 
        , "timeout": 0            //The timeout period
      }
    )
    let lock = { uuid: null }
    HttpUtil.windowOpen('library?dialog=true&mode=folder_select', (folder_uuid) => {
      this.setState({
        is_loading: true
      }, () => {
        selectedDatas.forEach((selectedData: LibraryChild) => {
          queue.push(this.moveLibrary, [selectedData, folder_uuid, lock])
        })
        queue.push(this.setState, [{ is_loading: false }])
        queue.push(this.fetchFolder, [])
        queue.start()
      })
    })
  }

  onClickApply(selected_data: LibraryListDataType) {
    if (window.opener || !window.opener.closed) {
      window.opener.onCallbackApply(selected_data)
    }
    window.close()
  }

  onClickEditDatabase(data) {
    if (data.type !== Constants.library.type.database) {
      return
    }
    const rules = this.getDataBaseRules()
    const params = this.getDataBaseParams()
    this.setState({
      database: {
        "label": data.label,
        "dbms": data.dbms,
        "host": data.hostname,
        "port": data.port,
        "database": data.database,
        "user_id": data.user_id,
        "user_password": data.password
      }
    }, () => {
      const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules} onChange={(e, param, value) => this.onChangeEditDatabase(e, param, value)} ></ParamsForm>
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
        database: database
      }, () => {
        const rules = this.getDataBaseRules()
        const params = this.getDataBaseParams()
        const paramsForm = <ParamsForm params={params} args={this.state.database} invalids={{}} rules={rules} onChange={(e, param, value) => this.onChangeEditDatabase(e, param, value)} ></ParamsForm>
        ModalUtil.emitModal({
          id: Constants.modal.EDIT_DATABASE,
          visible: true,
          done: '編集する',
          danger: true,
          content: paramsForm
        })
      })
    } catch (e) {
      console.log(e)
    }
  }


  onClickLibrary(e, data, index): void {
    // クリックされたデータを１番目の位置にする
    let selectedDatas: LibraryChild[] = this.state.selectedDatas
    let lastSelected: LibraryChild | null = this.state.lastSelected

    if (e.metaKey || e.ctrlKey) {
      // command or ctrl + click
      if (selectedDatas.includes(data)) {
        selectedDatas = selectedDatas.filter(d => d.uuid !== data.uuid)
      } else {
        selectedDatas.push(data)
      }
    } else if (e.shiftKey) {
      // shift + click
      let current = this.state.libraryChildren.indexOf(data)
      if (lastSelected) {
        let last = this.state.libraryChildren.indexOf(lastSelected)
        let min, max
        if (current >= last) {
          min = last
          max = current
        } else {
          min = current
          max = last
        }
        selectedDatas = this.state.libraryChildren.slice(min, max + 1)
      }
    } else {
      // 単一選択
      if (this.state.selectedDatas.includes(data)) {
        selectedDatas = []
      } else {
        selectedDatas = [data]
      }
    }
    lastSelected = data

    this.setState({
      selectedDatas: selectedDatas,
      lastSelected: lastSelected
    }, () => {
      //console.log(selectedDatas)
    })
  }

  onChangeSearchText(e) {
    let searchText = e.target.value
    this.setState({
      searchText:searchText
    })
  }

  editLibraryChild(data) {
    APIUtil.put('databases/' + data.uuid, this.state.database).then((response) => {
      this.completeEditDatabase(response)
    }, () => {
      this.unhandledNotify('データベース修正エラー')
    })
  }

  makeHistory(folderPath: any[]): BreadCrumbHistoryType[] {
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

  makeLibraryURL(uuid: string): string {
    return '/folders/' + uuid
  }

  editFlow(flow_uuid, parent_uuid) {
    const { notify } = this.props
    let body: any = { target: flow_uuid }
    let locks = new LocksModel(body)
    return axios.post('/api/v0/locks', body)
      .then((response) => {
        let locksModel = locks.Parse(response)
        let lockId = locksModel.getLockId()
        if (lockId) {
          axios.put('/api/v0/flows/' + flow_uuid, {
            parent: parent_uuid,
            lock: lockId
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

  onBlurTitle(
    e: React.FocusEvent<HTMLInputElement>, selected_data: any) {
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

    let body: any = {
      label: e.target.value,
    }
    if (selected_data.type === Constants.library.type.database) {
      body = {
        label: e.target.value,
        dbms: selected_data.dbms,
        hostname: selected_data.hostname,
        port: selected_data.port,
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
        }, () => {
          this.forceUpdate()
        })
      }
    })
  }

  getEndPoint(libraryType: string): string | null {
    let endPoint: string | null = null
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

  updateLibrary(libraryChildren: any[], uuid: string, library) {
    return libraryChildren.map((child: any) => {
      if (uuid === child.uuid) {
        return library
      }
      return child
    })
  }

  findLibrary(libraryChildren: any[], uuid: string) {
    return libraryChildren.find((child: any) => { return (child.uuid === uuid) })
  }

  isDialog() {
    return (HttpUtil.getURLParam('dialog'))
  }

  getHeaders(): any[] {
    return [
      "", // icon
      "名前",
      "作成者",
      "作成日時"
    ]
  }

  getColumns(data: LibraryChild, index: number): any[] {
    let dialogOption = (this.state.is_dialog) ? '?dialog=true' + '&mode=' + this.state.mode : ''
    let label: any
    if (data.type === Constants.library.type.folder) {
      label = <a href={'/folders/' + data.uuid + dialogOption}>{data.label}</a>
    } else {
      label = data.label
    }
    return [
      <IconRender type={data.type} />,
      label,
      data.creator,
      data.createdAt
    ]
  }

  renderSearchBar () {
    return <div className={style.search_bar}>
      <TextField placeholder={'ライブラリーを検索'} onChange={(e) => this.onChangeSearchText(e)} />
    </div>
  }

  renderButton(onClick: Function, title: string, icon: string) {
    return <a
      className={classnames(libraryListStyle.library, libraryListStyle.new)}
      href="#" onClick={(e) => onClick(e)}>
      <div className={libraryListStyle.library_list}>
        <div className={libraryListStyle.name}>
          <i className={classnames('material-icons', [libraryListStyle.icon])}>{icon}</i>
          {title}
        </div>
      </div>
    </a >
  }

  renderEmptyState() {
    return <EmptyState
      icon={'inbox'}
      title={'ライブラリが空です'}
      description={'表示できるファイルがありません'}>
    </EmptyState>
  }

  renderNewFolder() {
    return this.renderButton((e) => this.onClickNewFolder(e), 'フォルダを作成する', 'add_circle_outline')
  }

  /*
  renderNewDocument() {
    return this.renderButton((e) => this.onClickNewDocument(e), '資料をアップロードする', 'add_circle_outline')
  }

  renderNewRemoteFolder() {
    return this.renderButton((e) => this.onClickNewRemoteFolder(e), 'ファイルサーバを追加する', 'add_circle_outline')
  }
  */

  renderNewFrame() {
    return this.renderButton((e) => this.onClickNewFrame(e), 'CSVをアップロードする', 'add_circle_outline')
  }

  renderNewDatabase() {
    return this.renderButton((e) => this.onClickNewDatabase(e), 'データベースを追加する', 'add_circle_outline')
  }

  renderSelectDestination() {
    return this.renderButton((e) => this.onClickSelectDestination(e), '移動する', 'input')
  }

  renderBreadCrumb() {
    if (Array.isArray(this.state.folderPath)) {
      return <BreadCrumb history={this.makeHistory(this.state.folderPath)} />
    }
    return null
  }

  renderInspector() {
    const { notify, dissmissNotify } = this.props
    const data: LibraryListDataType = this.state.lastSelected
    let onClickDelete: any = null
    let onClickApply: any = null
    let onClickMove: any = null
    let onClickEdit: any = null

    switch (this.state.mode) {
      case Constants.library.mode.frame_select:
        if (data && data.type === Constants.library.type.frame) {
          onClickApply = (data) => this.onClickApply(data)
        }
        break
      case Constants.library.mode.folder_select:
        break
      case Constants.library.mode.list:
        onClickDelete = () => this.onClickDelete()
        onClickMove = () => this.onClickMove()
        if (data && data.type === Constants.library.type.database) {
          onClickEdit = (data) => this.onClickEditDatabase(data)
        }
        break
    }
    return <LibraryInspector
      selected={this.state.selectedDatas}
      lastSelected={this.state.lastSelected}
      onClickDelete={onClickDelete}
      onClickApply={onClickApply}
      onClickMove={onClickMove}
      onClickEdit={onClickEdit}
      onBlurTitle={(e) => this.onBlurTitle(e, data)}
      visualizers={this.state.visualizers}
      notify={notify}
      dissmissNotify={dissmissNotify}
    />
  }

  renderAll() {
    if (!this.state.is_finished) return null
    if (this.isEmptyLibraryList() && this.state.mode === Constants.library.mode.dialog) return this.renderEmptyState()

    // 普通にライブラリーを開いた時
    let newUI = <div>
      {this.renderNewFolder()}
      {/*{this.renderNewDocument()}*/}
      {this.renderNewFrame()}
      {this.renderNewDatabase()}
    </div>

    // 異動先選択など
    let selectUI = <div>
      {this.renderSelectDestination()}
    </div>

    let list = this.state.libraryChildren.filter((libray) => libray.label.includes(this.state.searchText))

    return <div>
      {this.renderBreadCrumb()}
      <List<LibraryChild>
        lists={list}
        selected={this.state.selectedDatas}
        getHeaders={this.getHeaders}
        getColumns={this.getColumns}
        onClickData={this.onClickLibrary}
      />
      {this.renderInspector()}
      {(this.state.mode === Constants.library.mode.list) ? newUI : null}
      {(this.state.mode === Constants.library.mode.folder_select) ? selectUI : null}
    </div>
  }

  render() {
    const { notify, dissmissNotify } = this.props

    let containerClassName = (this.isDialog()) ? 'container' : 'container mt-40px'
    return <div className={style.inspector_list_container}>
      <div className={containerClassName}>
        {this.renderSearchBar()}
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

