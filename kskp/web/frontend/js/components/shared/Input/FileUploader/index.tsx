import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import { Button, TextField } from 'Shared/Input'
import { APIUtil } from 'Utils/index'

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
  uploadFiles: UploadFile[]
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
      uploadFiles: []
    }
  }

  onChangeUploadName(e, index: number, uploadFiles: UploadFile[]) {
    let newUploadFiles = uploadFiles.slice(0, uploadFiles.length)
    uploadFiles[index].uploadName = e.target.value

    this.setState({
      uploadFiles: newUploadFiles
    })
  }

  onChangeFile(e) {
    const fileList: FileList = e.target.files

    let uploadFiles: UploadFile[] = []
    Array.from(fileList).forEach((file: File, index) => {
      let uploadFile: UploadFile = {
        file: file,
        uploadName: file.name,
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

  onClickCancle(e) {

  }

  onClickUpload(e) {
    const { notify, parentUUID, url } = this.props
    const options = {
      headers: { 'enctype': 'multipart/form-data' }
    }

    let uploads_success: any[] = []
    let uploads_fail: any[] = []

    let uploads: any[] = []
    this.state.uploadFiles.forEach((uploadFile: UploadFile, index: number) => {
      const promise = new Promise((resolve, reject) => {
        let formData: FormData = new FormData()
        formData.append('file', uploadFile.file)
        formData.append('label', uploadFile.uploadName)
        if (parentUUID) formData.append('parent', parentUUID)
        APIUtil.post(url, formData, options)
          .then((response) => {
            if (!response.data.success) throw response
            uploadFile.status = Status.Success
            uploads_success.push(uploadFile)
          })
          .catch((error) => {
            uploadFile.status = Status.Fail
            uploads_fail.push(uploadFile)
          })
          .then(() => {
            this.forceUpdate(() => {
              resolve()
            })
          })
      })
      uploads.push(promise)
    })

    Promise.all(uploads).then(() => {
      let success = "アップロード成功： "
      let fail = "アップロード失敗： "

      uploads_success.forEach((uploadFile: UploadFile) => {
        success = success + uploadFile.uploadName + " "
      })
      uploads_fail.forEach((uploadFile: UploadFile) => {
        fail = fail + uploadFile.uploadName + " "
      })

      const message = success + "\n" + fail
      notify({
        title: 'アップロード結果',
        message: message,
        status: 'success'
      })
    })
  }


  renderFields(uploadFiles: UploadFile[]) {
    let fields: any = []

    if (uploadFiles.length > 0) {
      uploadFiles.forEach((uploadFile: UploadFile, index: number) => {
        let field = <div className={style.field} key={uploadFile.uploadName + index}>
          <div className={style.textField}>
            {this.renderIcon(uploadFile.status)}
            <TextField placeholder={'名称'} defaultValue={uploadFile.uploadName} onChange={(e, index, uploadFiles) => this.onChangeUploadName(e, index, uploadFiles)} />
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
        result = <i className={'material-icons'}>{'assignment_return'}</i>
        break;
      case Status.Success:
        result = <i className={'material-icons'}>{'assignment_turned_in'}</i>
        break;
      case Status.Fail:
        result = <i className={'material-icons'}>{'assignment_late'}</i>
        break;
    }

    return result
  }

  renderSelectFiles() {
    const title = 'ファイルを選択する'
    const icon = 'add_circle_outline'
    const onClick = (e) => this.onClickFileSelect(e)

    return <React.Fragment key={title + icon}>
      <a href="#" className={style.button} onClick={onClick}>
        <i className={'material-icons'}>{icon}</i>
        {title}
      </a >
    </React.Fragment>
  }

  renderButtons() {
    const cancle = "キャンセル"
    const onClickCancle = (e) => this.onClickCancle(e)
    const cancleButton = <Button
      onClick={onClickCancle}>
      {cancle}
    </Button>

    const upload = "アップロード"
    const onClickUpload = (e) => this.onClickUpload(e)
    const uploadButton = <Button primary={true}
      onClick={onClickUpload}>
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
      {this.renderButtons()}
      {this.renderFields(this.state.uploadFiles)}
      <div className={'mt-8px'} />
      {this.renderSelectFiles()}
      <input type="file" ref={'file'} accept={attrAccept} multiple={true} className={style.input_file} onChange={(e) => this.onChangeFile(e)} />
    </div>
  }
}