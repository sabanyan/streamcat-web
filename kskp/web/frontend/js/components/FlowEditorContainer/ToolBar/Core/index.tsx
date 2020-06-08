import React from 'react'
import Constants from 'Constants/index'
import { DataSourceImport, Note, Redo, Undo, Run, Save, Sort, Zoom } from 'FlowEditorContainer/ToolBar'
import style from './style.scss'
import classnames from 'classnames'
import { DataFrameStepModelProps } from 'Model/Step/DataFrameStepModel'
import { DataFrameStepModel, NoteStepModel, MessageModel } from 'Model/index';
import { APIUtil, FlowUtil, HttpUtil, PositionUtil, ReactDomUtil, ZoomUtil } from 'Utils/index'
import { Loader } from 'Shared/Base'
import { HistoryType, LibraryListDataType, RunResponseType, UploadedFileType } from 'Types/index'
import { NoteStepModelProps } from 'Model/Step/NoteStepModel'
import { defaultGraphProps } from 'Utils/GraphUtil'
import { FlowModel } from "Model/index";
import { API } from 'Modules/api/index'

type ToolBarProps = {
  flow: FlowModel;
  nodes: any[];
  history: HistoryType;
  zoom: number;
  lockUUID?: string;
  disabled?: boolean;

  notify: Function;
  dismissNotify: Function;
  addStep: Function;
  addHistory: Function;
  sortFlow: Function;
  loadFlowJSON: Function;
  selectSteps: Function;
  setZoom: Function;
  undo: Function;
  redo: Function;
}

export default class ToolBar extends React.Component<ToolBarProps> {

  loading: boolean = false
  loadingMessage: string = ""
  uploadedFile: UploadedFileType = null

  constructor(props: ToolBarProps) {
    super(props)
  }

  onClickSave() {
    this.saveFlow()
  }

  saveFlow() {
    const { flow, nodes, lockUUID, notify, dismissNotify } = this.props

    let saveNotify = notify({
      title: 'フロー保存中',
      message: 'フローの設定を保存しています',
      status: 'loading',
      dismissAfter: 0,
    })

    flow.nodes = nodes

    return new Promise(async (reslove, reject) => {
      // 編集権限がないと、保存不可

      //　フロー保存
      await API.request.doPut.flow({
        flowUUID: inject_flow_uuid,
        flow: flow,
        lockUUID: (lockUUID) ? lockUUID : ""
      })
        .then((response) => {
          dismissNotify(saveNotify.id)
          if (response.data.success === true) {
            reslove(response.data)
          } else {
            reject(response.data)
          }
        })

    })
      // 保存失敗した場合、エラーメッセージ出力
      .catch(e => {
        notify({
          title: 'フロー保存エラー',
          message: e.message,
          status: 'error',
          dismissAfter: -1,
          closeButton: true
        })
      })
  }

  onClickSort() {
    this.props.sortFlow()
    this.props.addHistory()
  }

  renderRunResult(json: RunResponseType) {
    const result = json.lasts.map((n) => {
      return <li>{n.id}</li>
    })
    const content = <div>
      <div>ライブラリにフローの実行結果が追加されました。</div>
      <ul>{result}</ul>
    </div>

    return content
  }
  run() {
    let { notify, dismissNotify } = this.props
    const runArgs = {
      'flow_uuid': inject_flow_uuid,
      'flows': [],
      'variables': []
    }
    return FlowUtil.runWithArgs(runArgs, notify, dismissNotify)
      .then((response) => {
        if (response.data.success) {
          const json: RunResponseType = response.data
          const content = this.renderRunResult(json)

          // 結果出力
          let notifyId = notify({
            title: 'フロー実行完了',
            message: ReactDomUtil.renderToString(content),
            status: 'success',
            dismissAfter: 0,
            buttons: [
              {
                name: '閉じる',
                primary: true,
                onClick: () => {
                  this.props.dismissNotify(notifyId)
                },
              },
              {
                name: '開く',
                primary: true,
                onClick: () => {
                  window.open('/library', '_blank')
                },
              }],
          })
        }
        this.loading = false
        // 実行後、各ノードのキャッシュ情報（キャッシュ作成日、uuid)を最新化するため
        this.flowUpdate()
      })
      .catch((e) => {
        this.loading = false
        this.loading = false
        this.forceUpdate()
      })
  }

  onClickProjectRun() {
    const { lockUUID } = this.props

    this.loading = true
    this.loadingMessage = ''
    
    this.saveFlow()
      .then((result: any) => {
        if (result && result.success === true) this.run()
        this.loading = false
      })
  }

  flowUpdate() {
    APIUtil.get('flows/' + inject_flow_uuid).then((response) => {
      const json = response.data
      this.props.loadFlowJSON(json)
    })
  }

  onClickDataSourceImport() {

    const self = this

    this.uploadedFile = null
    this.forceUpdate()

    HttpUtil.windowOpen('library?dialog=true&mode=frame_select', (args) => {
      const selected_data: LibraryListDataType = args
      let parameters = {}
      //データソースを追加
      const props: DataFrameStepModelProps = {
        type: selected_data.type,
        uuid: selected_data.uuid,
        label: selected_data.label,
        dataSource: Constants.data.dataSource.csv,
        srcs: [],
        dsts: [],
      }
      const add_step = new DataFrameStepModel(props)
      this.props.addStep(add_step)
      //ステップの選択をキャンセル
      this.props.selectSteps()
      this.props.addHistory()
    })
  }

  onChangeFile(e: any) {
    const selectedFiles: FileList = e.target.files
    if (selectedFiles) {
      const uploadFile: File = selectedFiles[0]
      APIUtil.frameUpload(uploadFile, uploadFile.name).then((response) => {
        const { success } = response.data
        const json = response.data
        if (success) {
          this.uploadedFile = {
            label: json.data.label,
            uuid: json.data.uuid,
            file: uploadFile,
          }
          this.forceUpdate()
        }
      })
    }
  }

  onClickZoomIn(e: Event) {
    this.props.setZoom({ offset: 10 })
  }

  onClickZoomOut(e: Event) {
    this.props.setZoom({ offset: -10 })
  }

  onClickDefaultZoom(e: Event) {
    this.props.setZoom({ value: 100 })
  }

  onClickNote() {

    const { zoom, nodes } = this.props;
    let position = PositionUtil.getCenterPosition('#flow_editor>div')
    position = {
      x: ZoomUtil.zoomReverse(position.x, zoom),
      y: ZoomUtil.zoomReverse(position.y, zoom)
        + Constants.default.step.height
        + defaultGraphProps.rankSeparator,
    }

    const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition(
      { ...position }, nodes)

    const props: NoteStepModelProps = {
      type: Constants.step.type.note,
      position: notOverlapNodePosition,
      size: { width: 30, height: 20 },
      title: '新しいメモ',
      content: '新しいメモ',
    }

    const note = new NoteStepModel(props)
    this.props.addStep(note)
    this.props.addHistory()

  }

  render() {
    const { zoom, history, disabled } = this.props

    const current = history.current
    const max = history.nodes.length

    const redoDisabled = !(current + 1 < max)
    const undoDisabled = !(current - 1 >= 0)
    return <div>
      <div className={classnames(style.flow_toolbar)}>
        <Save disabled={disabled} icon={'&#xE2C2'}
          onClick={(e) => this.onClickSave()}>保存</Save>
        <DataSourceImport disabled={disabled} icon={'&#xE2C2'}
          onClick={(e) => this.onClickDataSourceImport()}>データソースの追加</DataSourceImport>
        <Run disabled={disabled} icon={'&#xE037'}
          onClick={(e) => this.onClickProjectRun()}>このフローを実行</Run>
        <Note disabled={disabled} icon={'comment'}
          onClick={() => this.onClickNote()}>メモ</Note>
        <Undo disabled={undoDisabled} icon={'undo'}
          onClick={() => this.props.undo()}>もとに戻す</Undo>
        <Redo disabled={redoDisabled} icon={'redo'}
          onClick={() => this.props.redo()}>繰り返す</Redo>
      </div>
      <div className={classnames(style.paper_toolbar)}>
        <Zoom onClickZoomIn={(e) => this.onClickZoomIn(e)}
          onClickZoomOut={(e) => this.onClickZoomOut(e)}
          onClickDefaultZoom={(e) => this.onClickDefaultZoom(e)}
          zoom={zoom} />
        <Sort disabled={disabled} icon={'&#xE42A'}
          onClick={(e) => this.onClickSort()}>整列</Sort>
      </div>
      <Loader whiteBackground={true} center={true} absolute={true} fixed={false}
        visible={this.loading} message={this.loadingMessage} />
    </div>
  }
}