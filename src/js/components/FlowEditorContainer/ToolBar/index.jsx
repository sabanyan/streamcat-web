//@flow
import React from 'react'
import ModalUtil from '../../../utils/ModalUtil'
import Constants from '../../../constants'
import DataTable from '../../shared/DataTable/index'
import Save from './Save'
import Run from './Run'
import Sort from './Sort'
import Suspend from './Suspend'
import DryRun from './DryRun'
import Download from './Download'
import DataSourceImport from './DataSourceImport'
import Zoom from './Zoom'
import style from './style.scss'
import classnames from 'classnames'
import DataFrameStepModel from '../../../model/Step/DataFrameStepModel'
import APIUtil from '../../../utils/APIUtil'
import HttpUtil from '../../../utils/HttpUtil'
import type { FlowEditorProps } from '../index'
import type { DataFrameStepModelProps } from '../../../model/Step/DataFrameStepModel'
import Loader from '../../shared/Loader'
import { RunResponseType } from '../../../types'
import FileUploader from '../../shared/FileUploader'
import type { UploadedFileType } from '../../../types'
import FlowUtil from '../../../utils/FlowUtil'
import StringUtil from '../../../utils/StringUtil'
import ErrorUtil from '../../../utils/ErrorUtil'
import Undo from './Undo'
import Redo from './Redo'
import Button from '../../shared/Button'
import ReactDomUtil from '../../../utils/ReactDomUtil'
import Note from './Note'
import NoteStepModel from '../../../model/Step/NoteStepModel'
import {NoteStepModelProps} from '../../../model/Step/NoteStepModel'
import ModelUtil from '../../../utils/ModelUtil';
import PositionUtil from '../../../utils/PositionUtil';
import { defaultGraphProps } from '../../../utils/Graph'
import ZoomUtil from '../../../utils/ZoomUtil'

type ToolBarProps = {
  ...FlowEditorProps
}

export default class ToolBar extends React.Component<ToolBarProps> {

  loading: boolean = false
  loadingMessage: string
  uploadedFile: UploadedFileType = null

  constructor (props: ToolBarProps) {
    super(props)
  }

  onClickSave () {
    //this.saveFlowPorts()
    //this.saveNodes()
    this.saveFlow()
  }

  /*
  *
  */
  saveFlow() {
    const {flow, nodes, history, notify, dismissNotify} = this.props
    return FlowUtil.saveFlow(inject_flow_uuid, {
                                label: flow.label,
                                description: flow.description,
                                params:flow.params,
                                ports: flow.ports,
                                nodes: nodes
                                },
                              notify,
                              dismissNotify)
  }

  saveFlowPorts () {
    const {flow, notify, dismissNotify} = this.props
    FlowUtil.saveFlowSettings(inject_flow_uuid, {ports: flow.ports,label: flow.label, description: flow.description,params:flow.params}, notify, dismissNotify)

  }

  saveNodes () {
    let {nodes, history, notify, dismissNotify} = this.props
    return FlowUtil.saveNodes(inject_flow_uuid, nodes, notify, dismissNotify)
  }

  onClickSort () {
    this.props.addHistory()
    this.props.sortFlow()
  }

  save (): Promise {
    let {nodes, projectId, projectName, notify, dismissNotify, history} = this.props
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
                  window.open('/library?project=' +
                    window.navigationModel.project_uuid, '_blank')
                },
              }],
          })
          // cache 情報更新のため
          this.updateCache()
          this.props.executeFlow()
        }
        this.loading = false
        this.forceUpdate()
      }, (error) => {
        this.loading = false
        this.forceUpdate()
      })
    })
  }

  updateCache() {
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

    ModalUtil.registerModal({
      id: Constants.modal.IMPORT_DATASOURCE, onClickDone: () => {

        if (!this.uploadedFile) {
          alert('ファイルを選択してください')
          return
        }

        let parameters = {}

        //データソースを追加

        const label = this.uploadedFile.label
        const uuid = this.uploadedFile.uuid
        const props: DataFrameStepModelProps = {
          id: label,
          type: Constants.step.type.frame,
          uuid: uuid,
          label: label,
          dataSource: Constants.data.dataSource.csv,
          srcs: [],
          dsts: [],
        }

        const add_step = new DataFrameStepModel(props)

        self.props.addStep(add_step)

        //ステップの選択をキャンセル
        self.props.selectSteps()

        //モーダルを閉じる
        ModalUtil.closeModal(Constants.modal.IMPORT_DATASOURCE)
      },
    })

    const content = <FileUploader accept={['text/csv']}
                                  defaultLabel={'ファイルを選択してください'}
                                  onChangeFile={(e) => this.onChangeFile(e)}/>

    ModalUtil.emitModal({
      id: Constants.modal.IMPORT_DATASOURCE,
      visible: true,
      content: content,
      title: 'データソースの追加',
    })

  }

  onChangeFile (e: SyntheticInputEvent<EventTarget>) {
    const selectedFiles: FileList = e.target.files
    if (selectedFiles) {
      const uploadFile: File = selectedFiles[0]
      APIUtil.fileupload(uploadFile, uploadFile.name).then((response) => {
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
  onClickNote() {

    let position = PositionUtil.getCenterPosition("#flow_editor>div")
    position = {
      x: ZoomUtil.zoomReverse(position.x, this.props.zoom),
      y: ZoomUtil.zoomReverse(position.y, this.props.zoom)
         + Constants.default.step.height
         + defaultGraphProps.rankSeparator
    }

    const notOverlapNodePosition = FlowUtil.getNotOverlapNodePosition({...position}, this.props.nodes)

    const props:NoteStepModelProps = {
      type : Constants.step.type.note,
      position : notOverlapNodePosition,
      size : {width: 30, height: 20},
      title: "新しいメモ",
      content : "新しいメモ",
    }
  
    const note = new NoteStepModel(props)

    this.props.addStep(note)
  }

  render () {
    const {zoom} = this.props

    const current = this.props.history.current
    const max = this.props.history.nodes.length

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
        <Note disabled={false} icon={'comment'} onClick={()=>this.onClickNote()}>メモ</Note>
        {/*<Suspend disabled={true} icon={'&#xE034'}>実行中止</Suspend>*/}
        {/*<DryRun disabled={true} icon={"&#xE044"}>ドライラン</DryRun>*/}
        {/*<Download disabled={true} icon={"&#xE2C4"}>ダウンロード</Download>*/}
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