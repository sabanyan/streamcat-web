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
import DataFrameModel from '../../../model/DataFrameModel'
import HttpUtil from '../../../utils/HttpUtil'

export default class Toolbar extends React.Component {
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
    this.props.sortFlowAction()
  }

  getFlowJson(){
    let {selected_step_ids, nodes,projectId,projectName} = this.props

    const flow_json = {
      projectId: projectId,
      name: projectName,
      nodes: nodes,
    }

    return flow_json
  }


  save () {
    return new Promise((resolve, reject) => {
      console.log("リクエストJSON")
      console.log(this.getFlowJson())
      HttpUtil.put("flows/" + inject_flow_uuid,this.getFlowJson()).then((response)=>{
        console.log("保存結果")
        console.log(response)
        resolve(response)
      })
    })
  }

  run () {
    return new Promise((resolve, reject) => {

      HttpUtil.get("frames?from=" + inject_flow_uuid).then((response)=>{
        console.log("実行結果")
        console.log(response)
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
        self.props.executeFlowAction()
      })
    })
  }

  onClickDataSourceImport () {

    const self = this

    ModalUtil.registerModal({
      id: Constants.modal.IMPORT_DATASOURCE, onClickDone: () => {

        let parameters = {}

        //モーダルで入力されたパラメータを取得
        // console.log(self.inputRefs)
        // self.inputRefs.map((inputRef) => {
        //     parameters[inputRef.argument.name] = inputRef.element.value
        //     inputRef.element.value = "" //値をクリア
        // })

        //データソースを追加

        const add_step = new DataFrameModel({
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

  render () {
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
        <Zoom></Zoom>
        <Sort disabled={false} icon={'&#xE42A'}
              onClick={(e) => this.onClickSort(e)}>整列</Sort>
      </div>
    </div>
  }
}