//@flow
import React from 'react'
import Constants from 'Constants/index'
import Save from 'FlowEditorContainer/ToolBar/Save'
import Run from 'FlowEditorContainer/ToolBar/Run'
import Sort from 'FlowEditorContainer/ToolBar/Sort'
import DataSourceImport from 'FlowEditorContainer/ToolBar/DataSourceImport'
import Zoom from 'FlowEditorContainer/ToolBar/Zoom'
import style from './style.scss'
import classnames from 'classnames'
import type { DataFrameStepModelProps } from 'Model/Step/DataFrameStepModel'
import { DataFrameStepModel, NoteStepModel } from 'Model/index'
import { APIUtil, FlowUtil, HttpUtil, PositionUtil, ReactDomUtil, ZoomUtil } from 'Utils/index'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { Loader } from 'Shared/Base'
import type { LibraryListDataType, RunResponseType, UploadedFileType, } from 'Types/index'
import Undo from 'FlowEditorContainer/ToolBar/Undo'
import Redo from 'FlowEditorContainer/ToolBar/Redo'
import Note from 'FlowEditorContainer/ToolBar/Note'
import { NoteStepModelProps } from 'Model/Step/NoteStepModel'
import { defaultGraphProps } from 'Utils/GraphUtil'
import type { FlowModelProps } from "Model/Flow/FlowModel";

type ToolBarProps = {
  flow: FlowModelProps;
  nodes: [];
  history: [];
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
  loadingMessage: string
  uploadedFile: UploadedFileType = null

  constructor (props: ToolBarProps) {
    super(props)
  }

  onClickSave () {
    this.saveFlow()
  }

  saveFlow () {
    const {flow, nodes, notify, dismissNotify} = this.props
    return FlowUtil.saveFlow(inject_flow_uuid, {
        label: flow.label,
        description: flow.description,
        params: flow.params,
        ports: flow.ports,
        nodes: nodes,
      },
      notify,
      dismissNotify)
  }

  saveFlowPorts () {
    const {flow, notify, dismissNotify} = this.props
    FlowUtil.saveFlowSettings(inject_flow_uuid, {
      ports: flow.ports,
      label: flow.label,
      description: flow.description,
      params: flow.params,
    }, notify, dismissNotify)

  }

  saveNodes () {
    let {nodes, notify, dismissNotify} = this.props
    return FlowUtil.saveNodes(inject_flow_uuid, nodes, notify, dismissNotify)
  }

  onClickSort () {
    this.props.sortFlow()
    this.props.addHistory()
  }

  save (): Promise {
    let {nodes, notify, dismissNotify} = this.props
    return FlowUtil.saveNodes(inject_flow_uuid, nodes, notify, dismissNotify)
  }

  run () {
    let {notify, dismissNotify} = this.props
    return FlowUtil.runNodes(inject_flow_uuid, notify, dismissNotify)
  }

  onClickProjectRun () {
    this.loading = true
    this.loadingMessage = ''

    this.forceUpdate()
    this.save().then(() => {
      this.run().then((response) => {
        if (response.data.success) {
          const json: RunResponseType = response.data
          const result = json.name.map((n) => {
            return <li>{n.id}</li>
          })
          const content = <div>
            <div>ライブラリにフローの実行結果が追加されました。</div>
            <ul>{result}</ul>
          </div>

          this.props.notify({
            title: 'フロー実行完了',
            message: ReactDomUtil.renderToString(content),
            status: 'success',
            dismissAfter: 0,
            buttons: [
              {
                name: '開く',
                primary: true,
                onClick: () => {
                  window.open('/library', '_blank')
                },
              }],
          })
          //現在、EXECUTE_FLOW_ACTIONは何もしないため 
          //this.props.executeFlow()
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

  flowUpdate () {
    APIUtil.get('flows/' + inject_flow_uuid).then((response) => {
      const json = response.data
      this.props.loadFlowJSON(json)
    })
  }

  //
  // showError(error){
  //   let errorBody
  //   if(error.data["message"]){
  //     errorBody = <div className={style.internal_error_body}>
  //       {error.data["message"]}
  //     </div>
  //   }else{
  //     errorBody = <div className={style.internal_error_body}><div>
  //       <strong>
  //         {error.request.statusText}
  //       </strong>
  //     </div>
  //       {StringUtil.stripHtmlToText(error.request.responseText)}
  //     </div>
  //   }
  //
  //   const content = <div>
  //     <div>フローの実行中にエラーが発生しました。</div>
  //     {errorBody}
  //   </div>
  //   ModalUtil.registerModal({
  //     id: Constants.modal.SHOW_RUN_ERROR
  //   })
  //   ModalUtil.emitModal({
  //     id: Constants.modal.SHOW_RUN_ERROR,
  //     visible: true,
  //     content: content
  //   })
  //   this.loading  = false
  //   this.forceUpdate()
  // }

  onClickDataSourceImport () {

    const self = this

    this.uploadedFile = null
    this.forceUpdate()

    HttpUtil.windowOpen('library?dialog=true', (args) => {
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

  onChangeFile (e: SyntheticInputEvent<EventTarget>) {
    const selectedFiles: FileList = e.target.files
    if (selectedFiles) {
      const uploadFile: File = selectedFiles[0]
      APIUtil.frameUpload(uploadFile, uploadFile.name).then((response) => {
        const {success} = response.data
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

  onClickZoomIn (e: Event) {
    this.props.setZoom({offset: 10})
  }

  onClickZoomOut (e: Event) {
    this.props.setZoom({offset: -10})
  }

  onClickDefaultZoom (e: Event) {
    this.props.setZoom({value: 100})
  }

  onClickNote () {

    const {zoom,nodes} = this.props;
    let position = PositionUtil.getCenterPosition('#flow_editor>div')
    position = {
      x: ZoomUtil.zoomReverse(position.x, zoom),
      y: ZoomUtil.zoomReverse(position.y, zoom)
      + Constants.default.step.height
      + defaultGraphProps.rankSeparator,
    }

    const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition(
      {...position}, nodes)

    const props: NoteStepModelProps = {
      type: Constants.step.type.note,
      position: notOverlapNodePosition,
      size: {width: 30, height: 20},
      title: '新しいメモ',
      content: '新しいメモ',
    }

    const note = new NoteStepModel(props)
    this.props.addStep(note)
    this.props.addHistory()

  }

  render () {
    const {zoom , history} = this.props

    const current = history.current
    const max = history.nodes.length

    const redoDisabled = !(current + 1 < max)
    const undoDisabled = !(current - 1 >= 0)
    return <div>
      <div className={classnames(style.flow_toolbar)}>
        <Save disabled={false} icon={'&#xE2C2'}
              onClick={(e) => this.onClickSave(e)}>保存</Save>
        <DataSourceImport disabled={false} icon={'&#xE2C2'}
                          onClick={(e) => this.onClickDataSourceImport(
                            e)}>データソースの追加</DataSourceImport>
        <Run disabled={false} icon={'&#xE037'}
             onClick={(e) => this.onClickProjectRun(e)}>このフローを実行</Run>
        <Note disabled={false} icon={'comment'}
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
              zoom={zoom}/>
        <Sort disabled={false} icon={'&#xE42A'}
              onClick={(e) => this.onClickSort(e)}>整列</Sort>
      </div>
      <Loader whiteBackground={true} center={true} absolute={true} fixed={false}
              visible={this.loading} message={this.loadingMessage}/>
    </div>
  }
}