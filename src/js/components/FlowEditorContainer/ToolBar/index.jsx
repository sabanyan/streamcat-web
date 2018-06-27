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
import DataSourceModel from '../../../model/DataSourceModel'
import classnames from 'classnames'

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

  save () {
    return new Promise((resolve, reject) => {
      let {selected_step_ids, steps, edges} = this.props

      const flow_json_text = {
        flow_json_text: {
          project_uuid: inject_project_uuid,
          name: inject_initial_flow_data.name,
          steps: steps,
          edges: edges,
        },
      }

      let option = {
        method: 'POST',
        body: JSON.stringify(flow_json_text),
        mode: 'same-origin',
        credentials: 'include',
        redirect: 'follow',
        headers: {
          'content-type': 'application/json',
        },
      }

      fetch('http://' + Constants.api.host + '/api/v0-1/flows/' +
        inject_flow_uuid + '/update', option).then(function (response) {
        if (response.ok) {
          return response.json()
        }
        else {
          alert('サーバでエラーが発生しました')
          reject()
        }
      }).then(function (json) {
        resolve(json)
      }).catch((err) => {
        console.log(err)
        alert('クライアントでエラーが発生しました')
        reject(err)
      })
    })

  }

  run () {
    return new Promise((resolve, reject) => {
      let option = {
        method: 'GET',
        mode: 'same-origin',
        credentials: 'include',
        redirect: 'follow',
      }

      fetch('http://' + Constants.api.host + '/api/v0-1/flows/' +
        inject_flow_uuid + '/execute', option).then(function (response) {
        if (response.ok) {
          return response.json()
        }
        else {
          alert('サーバでエラーが発生しました')
        }
      }).then(function (json) {
        resolve(json)
      }).catch((err) => {
        console.log(err)
        alert('クライアントでエラーが発生しました')
        reject(err)
      })
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
        const add_step = new DataSourceModel({
          operator: 'mtee',
          text: 'new datasource',
          property: {hasData: true},
          parameters: {
            o: 'new_datasource',
          },
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