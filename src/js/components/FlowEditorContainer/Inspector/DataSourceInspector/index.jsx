// @flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import Operator from '../../../shared/Operator/index'
import Inspector from '../Inspector'
import style from '../style.scss'
import type { FlowEditorProps } from '../../index'
import Button from '../../../shared/Button'
import DataPreview from '../../../shared/DataPreview'
import DropDownList from '../../../shared/DropDownList'
import DataFrameStepModel from '../../../../model/Step/DataFrameStepModel'
import CommandSelector from '../CommandSelector'
import FlowModel from '../../../../model/Flow/FlowModel'
import Graph from '../../../../utils/Graph'

class DataSourceInspector extends React.Component<FlowEditorProps> {

  componentWillMount () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.emitModal({id: Constants.preview.DATASOURCE, visible: false})
      },
    })
  }

  onClickPreview (e: Event) {
    let option = {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'include',
      redirect: 'follow',
    }

    //ファイル名を steps の パラメータから取得する
    const filename = this.props.nodes[this.props.selected_step_ids[0]].getFileName()

    fetch('http://' + Constants.api.host + '/api/v0-1/dataframe/' + filename,
      option).then(function (response) {
      console.log(response)
      if (response.ok) {
        return response.json()
      }
      else {
        alert('サーバでエラーが発生しました')
      }
    }).then(function (json) {
      console.log(json)
      if (json) {
        const content = <DataPreview json={json} />
        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          content: content,
          title: filename,
        })
      }
      else {
        alert('サーバからの応答結果がありません')
      }
    }).catch((err) => {
      console.log(err)
      alert('クライアントでエラーが発生しました')
    })

  }

  onClickDelete (e: Event) {
    if (window.confirm('このデータソースを削除しますか？')) {
      let {selected_step_ids, nodes} = this.props
      const selected_step = Graph.getNode(nodes,selected_step_ids[0])
      this.props.deleteSteps([selected_step.id])
      this.props.selectSteps()
    }
  }

  onChangeFlowInOut (e: Event) {
    let flow:FlowModel = this.props.flow
    const flowInChecked = this.refs.flowIn.checked
    const flowOutChecked = this.refs.flowOut.checked

    let selected_step = this.getSelectedStep()

    //パラメーターを更新
    const port = {name:selected_step.id,type: selected_step.type}

    if (flowInChecked) {
      flow.setInPort(port)
    } else {
      flow.deleteInPortWithId(selected_step.id)
    }

    if (flowOutChecked) {
      flow.setOutPort(port)
    } else {
      flow.deleteOutPortWithId(selected_step.id)
    }

    this.props.updateFlow(flow)
  }

  getSelectedStep () {
    let {selected_step_ids, nodes} = this.props
    return Graph.getNode(nodes,selected_step_ids[0])
  }

  render () {

    let step_text
    let dataSource
    let preview
    const self = this
    const selected_step = this.getSelectedStep()
    if (selected_step instanceof DataFrameStepModel) {
      dataSource = selected_step
      step_text = selected_step.text
      if (dataSource.uuid) {
        preview = <Button onClick={(e) => self.onClickPreview(e)}
                          icon={'visibility'}>プレビュー</Button>
      }
    }

    const flow:FlowModel  = this.props.flow
    console.log("CHECKED")
    console.log(flow.hasInPortWithId(selected_step.id))
    const flowInOutForm = <div className={style.flowInOut}>
      <div>
        <label><input type="checkbox" checked={flow.hasInPortWithId(selected_step.id)} ref={'flowIn'}
               onChange={(e) => this.onChangeFlowInOut(e)} />
        &nbsp;入力
        </label>
      </div>
      <div>
        <label><input type="checkbox" checked={flow.hasOutPortWithId(selected_step.id)}
               ref={'flowOut'}
               onChange={(e) => this.onChangeFlowInOut(e)} />
        &nbsp;出力
        </label>
      </div>
    </div>

    return <Inspector header={step_text} title={'データの概要'} {...this.props}>
      <div className={style.property_overview}>
        <div className={style.actions}>
          {preview}
          <Button onClick={(e) => self.onClickDelete(e)} icon={'delete'}
                  danger={true}>削除</Button>
        </div>
        <div className={style.overviews}>
          <div className={style.overview}>
            <div className={style.overview_label}>
              データの件数
            </div>
            <div className={style.overview_value}>
              - {/*{property.overview.count || 0}*/}
            </div>
          </div>
          <div className={style.overview}>
            <div className={style.overview_label}>
              作成日
            </div>
            <div className={style.overview_value}>
              - {/*{property.overview.created_at || ""}*/}
            </div>
          </div>
          <div className={style.overview}>
            <div className={style.overview_label}>
              作成者
            </div>
            <div className={style.overview_value}>
              - {/*{property.overview.created_user_name || ""}*/}
            </div>
          </div>
          <div className={style.overview}>
            <div className={style.overview_label}>
              フロー入出力
            </div>
            <div className={style.overview_value}>
              {flowInOutForm}
            </div>
          </div>
        </div>
      </div>
      <div className={style.hr} />
      <CommandSelector numberOfInput={1} {...this.props} />

      <div className={style.hr} />
      <div className={style.property_title}>
        作成したフロー
      </div>
      <div>
        <DropDownList list={[{name: 'サブフロー1', value: '1', object: {}}]} />
      </div>
    </Inspector>
  }

}

export default DataSourceInspector