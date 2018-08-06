// @flow
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
import DataSourceImport from './DatasourceImport'
import Zoom from './Zoom'
import style from './style.scss'
import classnames from 'classnames'
import DataFrameStepModel from '../../../model/Step/DataFrameStepModel'
import HttpUtil from '../../../utils/HttpUtil'
import type { FlowEditorProps } from '../index'
import type { DataFrameStepModelProps } from '../../../model/Step/DataFrameStepModel'
import Loader from '../../shared/Loader'
import { RunResponseType } from '../../../types'
import FileUploader from '../../shared/FileUploader'

type ToolbarProps = {
  ...FlowEditorProps
}

export default class Toolbar extends React.Component<ToolbarProps> {

  loading:boolean  = false
  loadingMessage:string
  uploadedFile:File = null

  constructor (props:ToolbarProps){
    super(props)
  }

  onClickSave () {
    this.loading = true
    this.loadingMessage = "フローを保存中です"
    this.save().then((json) => {
      if (json) {
        ModalUtil.emitModal({
          id: Constants.modal.SHOW_MESSAGE,
          visible: true,
          title: '保存完了',
          content: <div>フローを保存しました</div>,
        })
      }
      this.loading = false
      this.forceUpdate()
    })
  }

  onClickSort () {
    this.props.sortFlow()
  }

  getFlowJson(){
    let {nodes,projectId,projectName} = this.props

    const flow_json = {
      projectId: projectId,
      name: projectName,
      nodes: nodes,
    }

    return flow_json
  }


  save () {
    return new Promise((resolve, reject) => {
      HttpUtil.put("flows/" + inject_flow_uuid,this.getFlowJson()).then((response)=>{
        resolve(response)
      })
    })
  }

  run () {
    return HttpUtil.get("frames?from=" + inject_flow_uuid)

      // fetch('http://' + Constants.api.host + '/api/v0-1/flows/' +
      //   inject_flow_uuid + '/execute', option).then(function (response) {
      //   if (response.ok) {
      //     return response.json()
      //   }
      //   else {
      //     alert('サーバでエラーが発生しました')
      //   }
      // }).then(function (json) {
      //   resolve(json)
      // }).catch((err) => {
      //   console.log(err)
      //   alert('クライアントでエラーが発生しました')
      //   reject(err)
      // })

  }

  onClickProjectRun () {
    this.loading = true
    this.loadingMessage = "フローを実行中です"
    this.forceUpdate()
    this.save().then(() => {
      this.run().then((json) => {
        const resultData:RunResponseType = json.data
        const result = resultData.name.map((result)=>{
          return <li>{result}</li>
        })
        const content = <div>
          <div>フローの実行が完了し、以下のデータがライブラリに追加されました</div>
          <ul>{result}</ul>
        </div>

        ModalUtil.emitModal({
          id: Constants.modal.SHOW_RUN_RESULT,
          visible: true,
          content: content
        })
        ModalUtil.registerModal({
          id: Constants.modal.SHOW_RUN_RESULT, onClickDone: () => {
            window.open( "/library?project="+window.navigationModel.project_uuid, "_blank");
          }
        })
        //TODO 将来的に修正する（executeFlowAction は hasData = true に変更するためだけの処理になっています）
        this.props.executeFlow()
        this.loading  = false
        this.forceUpdate()
      },(error)=>{
        console.log(error)
        this.loading  = false
        this.forceUpdate()
      })
    })
  }

  onClickDataSourceImport () {

    const self = this

    this.uploadedFile = null
    this.forceUpdate()

    ModalUtil.registerModal({
      id: Constants.modal.IMPORT_DATASOURCE, onClickDone: () => {

        if(!this.uploadedFile){
          alert("ファイルを選択してください")
          return
        }

        let parameters = {}

        //データソースを追加

        const fileName = this.uploadedFile.name.split(".")
        const uuid = (fileName.length)?fileName[0]:fileName
        const props:DataFrameStepModelProps = {
          id: null,
          type: Constants.step.type.frame,
          uuid: uuid,//TODO 将来的にはサーバからUUIDをもらうなどするべき
          label: this.uploadedFile.name,
          dataSource: Constants.data.dataSource.csv,
          srcs: [],
          dsts: [],
        }

        const add_step = new DataFrameStepModel(props)

        self.props.addStep(add_step)

        //ステップの選択をキャンセル
        self.props.selectSteps()

        //モーダルを閉じる
        ModalUtil.emitModal(
          {id: Constants.modal.IMPORT_DATASOURCE, visible: false})
      },
    })

    const content = <FileUploader accept={['text/csv']} defaultLabel={'ファイルを選択してください'}
                                          onChangeFile={(e) => this.onChangeFile(e)} />

    ModalUtil.emitModal({
      id: Constants.modal.IMPORT_DATASOURCE,
      visible: true,
      content: content,
      title: 'データソースの追加',
    })

  }

  onChangeFile(e:SyntheticInputEvent<EventTarget>){
    const selectedFiles:FileList =  e.target.files
    if(selectedFiles){
      const uploadFile:File = selectedFiles[0]
      HttpUtil.fileupload(uploadFile,uploadFile.name).then((response)=>{
        const {success} = response.data
        if(success){
          this.uploadedFile = uploadFile
          this.forceUpdate()
        }
      })
    }
  }

  onClickZoomIn(e:Event){
      this.props.setZoom({offset:10})
  }
  onClickZoomOut(e:Event){
    this.props.setZoom({offset:-10})
  }
  onClickDefaultZoom(e:Event){
    this.props.setZoom({value:100})
  }

  render () {
    const {zoom} = this.props
    return <div>
      <div className={classnames(style.flow_toolbar)}>
        <DataSourceImport disabled={false} icon={'&#xE2C2'}
                          onClick={(e) => this.onClickDataSourceImport(
                            e)}>データソースの追加</DataSourceImport>
        <Save disabled={false} icon={'&#xE2C2'}
              onClick={(e) => this.onClickSave(e)}>保存</Save>
        <Run disabled={false} icon={'&#xE037'}
             onClick={(e) => this.onClickProjectRun(e)}>このフローを実行</Run>
        <Suspend disabled={true} icon={'&#xE034'}>実行中止</Suspend>
        {/*<DryRun disabled={true} icon={"&#xE044"}>ドライラン</DryRun>*/}
        {/*<Download disabled={true} icon={"&#xE2C4"}>ダウンロード</Download>*/}
      </div>
      <div className={classnames(style.paper_toolbar)}>
        <Zoom onClickZoomIn={(e)=>this.onClickZoomIn(e)}
              onClickZoomOut={(e)=>this.onClickZoomOut(e)}
              onClickDefaultZoom={(e)=>this.onClickDefaultZoom(e)}
              zoom={zoom}/>
        <Sort disabled={false} icon={'&#xE42A'}
              onClick={(e) => this.onClickSort(e)}>整列</Sort>
      </div>
      <Loader whiteBackground={true} center={true} absolute={true} fixed={false} visible={this.loading} message={this.loadingMessage}/>
    </div>
  }
}