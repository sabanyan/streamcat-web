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
import { FlowModelProps } from "Model/Flow/FlowModel";
import { API } from 'Modules/api/index'

type ToolBarProps = {
  flow: any;
  nodes: [];
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
  send: Function;
  connect: Function;
}

export default class ToolBar extends React.Component<ToolBarProps> {

  loading: boolean = false
  loadingMessage: string = ""
  uploadedFile: UploadedFileType = null
  ws:any = null

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

    return new Promise(async (resolve, reject) => {
      if (!lockUUID) {
        throw new MessageModel({
          title: '警告：読取専用フロー', 
          message: 'このフローはすでに編集中のため、 編集権限が取得できませんでした。', 
          messageStatus:"warning"
        })
      } 

      await API.request.doPut.flow({
        flowUUID: inject_flow_uuid,
        flow: flow,
        lockUUID: lockUUID
      })

      dismissNotify(saveNotify.id)
      resolve()
    })
  }

  onClickSort() {
    this.props.sortFlow()
    this.props.addHistory()
  }


  run() {
    let { notify, dismissNotify } = this.props
    const runArgs = {
      'flow_uuid': inject_flow_uuid,
      'flows': [],
      'variables': []
    }
    return FlowUtil.runWithArgs(runArgs, notify, dismissNotify)
  }

  runWithWebsocket() {
    const { connect, send, flow} = this.props

    send({ 
      type: 'MESSAGE_FLOW_EXCUTE_START',
      flowUUID: inject_flow_uuid,
      args: flow.params
    })
  }

  onClickProjectRun() {
    const { send, flow, notify } = this.props

    this.loading = true
    this.loadingMessage = ''

    this.saveFlow()
    .then(() => {
      this.runWithWebsocket()
    })
    .catch(e => {
      notify({
        title: e.title,
        message: e.message,
        status: e.messageStatus,
        dismissAfter: -1,
        closeButton: true
      })
    })
    .then(() => {
      this.loading = false
      this.flowUpdate()
      this.forceUpdate()
    })
  }

  /*
  onClickProjectRun() {
    this.loading = true
    this.loadingMessage = ''

    this.forceUpdate()
    let result = this.saveFlow()
    if (!result) {
      this.loading = false
      return
    }
    result.then(() => {
      this.run().then((response) => {
        if (response.data.success) {
          const json: RunResponseType = response.data
          const result = json.lasts.map((n) => {
            return <li>{n.id}</li>
          })
          const content = <div>
            <div>ライブラリにフローの実行結果が追加されました。</div>
            <ul>{result}</ul>
          </div>

          let notifyId = this.props.notify({
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
      }, (error) => {
        this.loading = false
        this.forceUpdate()
      })
    })
  }
  */

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
        <Zoom onClickZoomIn={(e) => this.onClickZoomIn(e)}
          onClickZoomOut={(e) => this.onClickZoomOut(e)}
          onClickDefaultZoom={(e) => this.onClickDefaultZoom(e)}
          zoom={zoom} />
        <Sort disabled={disabled} icon={'&#xE42A'}
          onClick={(e) => this.onClickSort()}>整列</Sort>
      </div>
      {/*
      <div className={classnames(style.paper_toolbar)}>
      </div>
      */}
      <Loader whiteBackground={true} center={true} absolute={true} fixed={false}
        visible={this.loading} message={this.loadingMessage} />
    </div>
  }
}