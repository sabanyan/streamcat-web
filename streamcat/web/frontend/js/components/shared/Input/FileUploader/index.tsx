import React from 'react'
import classnames from 'classnames'

import style from './style.scss'

import { Button, TextField } from 'Shared/Input'
import { Loader } from 'Shared/Base'
import { FolderType } from 'Model/Library'

type Props = {
  accept?: string[];
  parent: FolderType;
  uploadType: 'document'|'flow';
  notify: (title:string, message:string) => string;
  onSuccess?: () => void;
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
    const { notify, parent } = this.props

    const uploadTargets = this.state.uploadFiles.filter((uploadFile) => {
      if (uploadFile.status !== Status.Success) return true
      return false
    });

    Promise.all(
      uploadTargets.map((uploadFile, index) => {
        return this.promisedUpload(uploadFile, parent, this);
      })
    ).finally(() => {
      this.notifyUpload(uploadTargets, notify, this);
    });
  }

  promisedUpload(uploadFile:UploadFile, parent:FolderType, self=this) {
      // 引数の指定に応じてDocumentまたはFlowのアップロードのAPIを選択す
      const upload = self.props.uploadType==='document'?
          parent.createDocument(uploadFile.uploadName, uploadFile.file):
          parent.uploadFlow(uploadFile.uploadName, uploadFile.file);

      return upload.then(() => {
          uploadFile.status = Status.Success;
      }).catch((error) => {
          uploadFile.status = Status.Fail;
          console.log(error);
      });
  };

  notifyUpload(uploadTargets:UploadFile[], notify, self = this) {
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
      notify('アップロードしました', content);

      self.setState({
        isLoading: false
      })

      // イベントハンドラを呼び出す
      self.props.onSuccess && self.props.onSuccess();

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
      <a href="#" className={style.button} onClick={onClick}>
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
