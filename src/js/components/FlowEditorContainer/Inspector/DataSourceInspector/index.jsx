// @flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import Operator from '../../../shared/Command/index'
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
import HttpUtil from '../../../../utils/HttpUtil'
import type { StepModelType } from '../../../../types'
import type { CSVModelProps } from '../../../../model/CSV/CSVModel'
import CSVModel from '../../../../model/CSV/CSVModel'
import Loader from '../../../shared/Loader'

type DataFrameDetailType = {
  contents: {};
  numberOfLines: string;
  lastModifiedAt: string
}

class DataSourceInspector extends React.Component<FlowEditorProps> {

  dataFrameDetail:DataFrameDetailType = {
    contents: {},
    numberOfLines: "-",
    lastModifiedAt: "-"
  }

  loading:boolean = false

  componentWillMount () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.preview.DATASOURCE)
      },
    })

    //データフレームの詳細を取得する
    const {updateStep} = this.props
    const selected_step:StepModelType = this.getSelectedStep()
    if (selected_step instanceof DataFrameStepModel) {
      if(selected_step.hasData()){
        this.loading = true
        HttpUtil.get("frames/"+selected_step.uuid).then((response)=>{
          this.dataFrameDetail = response.data
          this.loading = false
          this.forceUpdate()
        })
      }else{
      }
    }
  }

  onClickPreview(e:Event){
    const selected_step = this.getSelectedStep()

    //すでにデータが存在している場合
    if(selected_step.hasData()){
      this.loading = true
      this.forceUpdate()
      HttpUtil.get("frames/"+selected_step.uuid).then((response)=>{
        const json = response.data
        let content = <DataPreview key={selected_step.uuid} json={json} />
        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          content: content,
          title: selected_step.label,
        })
        this.loading = false
        this.forceUpdate()
      })
    }else{
      this.loading = true
      this.forceUpdate()
      HttpUtil.get("frames?from="+inject_flow_uuid+"."+selected_step.id).then((response)=>{
        let content = <DataPreview key={selected_step.uuid} json={response.data} />
        ModalUtil.emitModal({
          id: Constants.preview.DATASOURCE,
          visible: true,
          content: content,
          title: selected_step.label,
        })
        this.loading = false
        this.forceUpdate()
      },(error)=>{
        console.log(error)
        this.loading = false
        this.forceUpdate()
      })
    }
    e.preventDefault()
  }

  onClickCSVDownload(e:Event){
    const selected_step = this.getSelectedStep()
    const param = {
        type:"frame",
        uuid: selected_step.uuid,
        ext:"csv"
    }
    HttpUtil.get("files",param).then((response)=>{
      let props:CSVModelProps = {
        uuid: selected_step.uuid,
        data: response.data,
      }
      const csv:CSVModel = new CSVModel(props)
      csv.handleDownload()
    })
  }
  onClickDelete (e: Event) {

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let {selected_step_ids, nodes} = this.props
        const selected_step = Graph.getNode(nodes,selected_step_ids[0])
        this.props.deleteSteps([selected_step.id])
        this.props.selectSteps()
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたデータソースを削除しますか？
      </div>,
    })
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

  getSelectedStep ():StepModelType {
    let {selected_step_ids, nodes} = this.props
    return Graph.getNode(nodes,selected_step_ids[0])
  }

  render () {

    let step_text
    let dataSource
    let preview
    let download
    const selected_step = this.getSelectedStep()
    if (selected_step instanceof DataFrameStepModel) {
      preview = <Button onClick={(e) => this.onClickPreview(e)}
                        icon={'visibility'}>プレビュー</Button>
      if (selected_step.hasData()) {
        download = <Button onClick={(e) => this.onClickCSVDownload(e)}
                          icon={'visibility'}>CSVダウンロード</Button>
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

    let content

    if(this.loading){
      content = <Loader center={true} absolute={true} fixed={false} visible={true}/>
    }else {
      content = <div>
        <div className={style.property_overview}>
          <div className={style.actions}>
            {preview}
            {download}
            <Button onClick={(e) => this.onClickDelete(e)} icon={'delete'}
                    danger={true}>削除</Button>
          </div>
          <div className={style.overviews}>
            <div className={style.overview}>
              <div className={style.overview_label}>
                データの件数
              </div>
              <div className={style.overview_value}>
                {this.dataFrameDetail.numberOfLines} {/*{property.overview.count || 0}*/}
              </div>
            </div>
            <div className={style.overview}>
              <div className={style.overview_label}>
                作成日
              </div>
              <div className={style.overview_value}>
                {this.dataFrameDetail.lastModifiedAt} {/*{property.overview.created_at || ""}*/}
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
      </div>
    }

    return <Inspector header={""} title={'データの概要'} {...this.props}>
      {content}
    </Inspector>
  }

}

export default DataSourceInspector