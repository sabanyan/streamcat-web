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

type ToolbarProps = {
  ...FlowEditorProps
}

export default class Toolbar extends React.Component<ToolbarProps> {

  constructor (props:ToolbarProps){
    super(props)
  }

  onClickSave () {
    this.save().then((json) => {
      if (json) {
        ModalUtil.emitModal({
          id: Constants.modal.SHOW_MESSAGE,
          visible: true,
          title: '保存完了',
          content: <div>フローを保存しました</div>,
        })
      }
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
    return new Promise((resolve, reject) => {

      HttpUtil.get("frames?from=" + inject_flow_uuid).then((response)=>{
        resolve(response)
      })

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
    })

  }

  onClickProjectRun () {
    const self = this
    this.save().then(() => {
      self.run().then((json) => {
        const content = <DataTable json={json}/>
        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          content: content,
          title: inject_initial_flow_data.name,
        })
        //TODO 将来的に修正する（executeFlowAction は hasData = true に変更するためだけの処理になっています）
        self.props.executeFlow()
      })
    })
  }

  onClickDataSourceImport () {

    const self = this

    ModalUtil.registerModal({
      id: Constants.modal.IMPORT_DATASOURCE, onClickDone: () => {

        let parameters = {}

        //データソースを追加

        const add_step = new DataFrameStepModel({
          id: null,//TODO IDはどうやってつける？
          type: Constants.step.type.frame,
          uuid: null,//TODO UUIDをどうやってつける？
          dataSource: Constants.data.dataSource.csv,
          srcs: [],
          dsts: [],
          asFlowIn: false,
          asFlowOut: false
        })

        self.props.addStep(add_step, null)

        //ステップの選択をキャンセル
        self.props.selectSteps()

        //モーダルを閉じる
        ModalUtil.emitModal(
          {id: Constants.modal.IMPORT_DATASOURCE, visible: false})
      },
    })

    const content = <div>
      <input type="file"/>
    </div>

    ModalUtil.emitModal({
      id: Constants.modal.IMPORT_DATASOURCE,
      visible: true,
      content: content,
      title: 'データソースの追加',
    })

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
    </div>
  }
}