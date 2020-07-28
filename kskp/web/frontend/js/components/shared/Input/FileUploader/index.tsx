import React from 'react'
import axios from 'axios'
import Queue from 'promise-queue-plus'
import classnames from 'classnames'

import style from './style.scss'

import { Button, TextField } from 'Shared/Input'
import { Loader } from 'Shared/Base'
import { ModalUtil } from "Utils/index";
import Constants from "Constants/index";

type Props = {
  url: string
  accept?: string[];

  parentUUID: string
  notify: Function
}

enum Status {
  Ready,
  Success,
  Fail
}

export type UploadFile = {
  file: File
  uploadName: string
  status: Status
}

type State = {
  uploadFiles: UploadFile[],
  isLoading: boolean
}

export default class FileUploader extends React.Component<Props, State> {

  static defaultProps = {
    accept: [],
    defaultLabel: '',
    disabled: false,
    onChangeFile: {},
    multiple: false
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      uploadFiles: [],
      isLoading: false
    }
  }

  onChangeUploadName(e, index: number) {
    this.state.uploadFiles[index].uploadName = e.target.value
  }

  onChangeFile(e) {
    const fileList: FileList = e.target.files
    let uploadFiles: UploadFile[] = []
    Array.from(fileList).forEach((file: File, index) => {
      let uploadFile: UploadFile = {
        file: file,
        uploadName: file.name.replace(/\..+$/, ''),
        status: Status.Ready
      }
      uploadFiles.push(uploadFile)
    })
    this.setState({
      uploadFiles: uploadFiles
    })
  }

  onClickFileSelect(e) {
    const element: any = this.refs.file
    element.click()
  }

  onClickUpload(e) {
    if (this.state.uploadFiles.length === 0) {
      alert('ファイルを選択してください')
      return
    }

    let noNames = this.state.uploadFiles.filter((uploadFile) => {
      return (!uploadFile.uploadName || uploadFile.uploadName === "")
    })

    if (noNames.length > 0) {
      alert('名称を入力してください')
      return
    }

    this.setState({
      isLoading: true
    }, () => {
      this.uploadSync()
    })
  }

  uploadSync() {
    const { notify, parentUUID, url } = this.props
    const options = {
      headers: { 'enctype': 'multipart/form-data' }
    }

    let queue = Queue(
      1, // concurrency
      {
        "retry": 0               //Number of retries
        , "retryIsJump": false     //retry now?
        , "timeout": 0            //The timeout period
      }
    )

    const uploadTargets = this.state.uploadFiles.filter((uploadFile) => {
      if (uploadFile.status !== Status.Success) return true
      return false
    })
    uploadTargets.forEach((uploadFile, index) => {
      queue.push(this.promisedUpload, [uploadFile, parentUUID, url, this])
    })
    queue.push(this.notifyUpload, [uploadTargets, notify, this])
    queue.start()
  }

  promisedUpload(uploadFile: UploadFile, parentUUID: string, url: string, self = this) {
    const options = {
      headers: { 'enctype': 'multipart/form-data' }
    }
    let formData: FormData = new FormData()
    formData.append('file', uploadFile.file)
    formData.append('label', uploadFile.uploadName)
    formData.append('parent', parentUUID)

    return new Promise((resolve, reject) => {
      axios.post(url, formData, options)
        .then((response) => {
          if (!response.data.success) throw response
          uploadFile.status = Status.Success
        })
        .catch((error) => {
          uploadFile.status = Status.Fail
          console.log(error)
        })
        .then(() => {
          self.forceUpdate(() => {
            resolve()
          })
        })
    })
  }

  notifyUpload(uploadTargets, notify, self = this) {
    return new Promise((resolve, reject) => {
      let successCount = 0
      let failCount = 0

      uploadTargets.forEach((uploadFile, index) => {
        if (uploadFile.status === Status.Success) {
          successCount = successCount + 1
        } else {
          failCount = failCount + 1
        }
      })

      let content = "アップロードが完了しました。<br> (成功:" + successCount + "、失敗:" + failCount + ")"
      notify({
        title: 'アップロードしました',
        message: content,
        status: 'success',
        dismissAfter: 0,
        allowHTML: true
      })

      self.setState({
        isLoading: false
      })

    })
  }

  renderFields(uploadFiles: UploadFile[]) {
    let fields: any = []

    if (uploadFiles.length > 0) {
      uploadFiles.forEach((uploadFile: UploadFile, index: number) => {
        let upload
        if (uploadFile.status !== Status.Success) {
          upload = <TextField placeholder={'名称'} defaultValue={uploadFile.uploadName} onChange={(e) => this.onChangeUploadName(e, index)} disabled={this.state.isLoading}/>
        } else {
          upload = <label className={style.upload}>{uploadFile.uploadName}</label>
        }
        let field = <div className={style.field} key={uploadFile.uploadName + index + this.state.isLoading}>
          <div className={style.textField}>
            {this.renderIcon(uploadFile.status)}
            {upload}
          </div>
          <div className={style.originalName}>
            <label >{uploadFile.file.name}</label>
          </div>
        </div>
        fields.push(field)
      })
    }

    return fields
  }

  renderIcon(status: Status) {
    let result
    switch (status) {
      case Status.Ready:
        result = <i className={classnames('material-icons', style.ready)}>{'assignment_return'}</i>
        break;
      case Status.Success:
        result = <i className={classnames('material-icons', style.success)}>{'assignment_turned_in'}</i>
        break;
      case Status.Fail:
        result = <i className={classnames('material-icons', style.fail)}>{'assignment_late'}</i>
        break;
    }

    return result
  }

  renderSelectFiles() {
    const title = 'ファイルを選択する'
    const icon = 'add_circle_outline'
    const onClick = (e) => this.onClickFileSelect(e)

    return <React.Fragment key={title + icon}>
      <a href="javascript:return false;" className={style.button} onClick={onClick}>
        <i className={'material-icons'}>{icon}</i>
        {title}
      </a >
    </React.Fragment>
  }

  renderButtons() {
    const uploads = this.state.uploadFiles.filter((uploadFile) => {
      if (uploadFile.status !== Status.Success) return true
      return false
    })
    const disabled = this.state.isLoading || uploads.length === 0 ? true : false
    const visibled = (uploads.length > 0)
    if(!visibled)return null;

    const upload = "アップロードする";
    const onClickUpload = (e) => this.onClickUpload(e)
    const uploadButton = <Button icon={"get_app"}
      primary={true}
      onClick={onClickUpload}
      disabled={disabled}
      >
      {upload}
    </Button>

    return <React.Fragment>
      <div className={style.uploadButton}>
        &nbsp;
        {uploadButton}
      </div>
    </React.Fragment>
  }

  render() {
    const { accept } = this.props
    const attrAccept = (accept) ? accept.join(',') : undefined

    return <div className={style.fileUploader}>
      <Loader center={true} absolute={true} visible={this.state.isLoading} />
      {this.renderButtons()}
      {this.renderFields(this.state.uploadFiles)}
      <div className={'mt-8px'} />
      {this.state.isLoading ? null : this.renderSelectFiles()}
      <input type="file" ref={'file'} accept={attrAccept} multiple={true} className={style.input_file} onChange={(e) => this.onChangeFile(e)} />
    </div>
  }
}
