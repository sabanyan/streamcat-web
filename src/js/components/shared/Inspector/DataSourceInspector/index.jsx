//@flow
import React from 'react'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import Operator from '../../Command/index'
import BaseInspector from '../BaseInspector/index'
import style from '../style.scss'
import type { FlowEditorProps } from '../../../FlowEditorContainer/index'
import Button from '../../Button/index'
import DataPreview from '../../DataPreview/index'
import DropDownList from '../../DropDownList/index'
import DataFrameStepModel from '../../../../model/Step/DataFrameStepModel'
import CommandSelector from '../../CommandSelector/index'
import FlowModel from '../../../../model/Flow/FlowModel'
import Graph from '../../../../utils/Graph'
import APIUtil from '../../../../utils/APIUtil'
import HttpUtil from '../../../../utils/HttpUtil'
import type { DataFrameDetailType, StepModelType } from '../../../../types/index'
import type { CSVModelProps } from '../../../../model/CSV/CSVModel'
import CSVModel from '../../../../model/CSV/CSVModel'
import Loader from '../../Loader/index'
import FlowUtil from '../../../../utils/FlowUtil'
import ChartUtil from '../../../../utils/ChartUtil'
import DataTable from '../../DataTable/index'
import StateUtil from '../../../../utils/State'
import StringUtil from '../../../../utils/StringUtil'
import { RunResponseType } from '../../../../types'
import ErrorUtil from '../../../../utils/ErrorUtil'
import Visualizer from '../../Visualizer'
import ReactDomUtil from '../../../../utils/ReactDomUtil'


type State = {
  dataFrameDetail?:DataFrameDetailType;
  loading: boolean;
}

class DataSourceInspector extends React.Component<FlowEditorProps,State> {


  loading:boolean = false

  constructor (props:FlowEditorProps){
    super(props)
    this.state = {
      loading: false
    }
  }

  componentWillMount () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.preview.DATASOURCE)
      },
    })
  }

  onClickPreview(e:Event) {
    const selected_step = this.getSelectedStep()

    let {nodes} = this.props


    FlowUtil.saveNodes(inject_flow_uuid, nodes).then(() => {

      //ヘッダー情報の取得

      const getFrameHeaderURL = "frames/" + selected_step.uuid
      APIUtil.get(getFrameHeaderURL + "?header_only=1").then((response) => {
        console.log(response)
      })

      //すでにデータが存在している場合
      if (selected_step.hasData()) {
        this.setState({
          loading: true
        })
        this.previewFromUUID(selected_step.uuid, selected_step.label)
      } else {
        const previewNotify = this.props.notify({
          title: 'プレビュー結果を取得中',
          message: 'プレビュー結果を取得しています',
          status: 'loading',
          dismissAfter: 0
        })
        this.setState({
          loading: true
        })

        const getFramesURL = "frames?from=" + inject_flow_uuid + "." + selected_step.id
        APIUtil.get(getFramesURL).then((response) => {
          this.props.dismissNotify(previewNotify.id)
          if (response.data.success) {
            const uuid = response.data.name[0].uuid
            const label = response.data.name[0].id
            this.previewFromUUID(uuid, label)
          } else {
            this.props.notify({
              title: 'プレビューエラー',
              message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
              status: 'error',
              dismissAfter: 0,
              closeButton: true
            })
            this.loading = false
            this.forceUpdate()
          }
          this.setState({
            loading: false
          })
        }, (error) => {
          this.props.dismissNotify(previewNotify.id)
          if (!response.data.success) {
            this.props.notify({
              title: 'プレビューエラー',
              message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(error)),
              status: 'error',
              dismissAfter: 0,
              closeButton: true
            })
            this.loading = false
            this.forceUpdate()
          }
          this.setState({
            loading: false
          })
        })
      }
    })
  }

  previewFromUUID(uuid:string,label:string){
    const {selected_data_source_detail} = this.props
    const selected_step = this.getSelectedStep()
    //TODO 将来的にはページングなどの対応が必要
    APIUtil.get("frames/" + uuid + "?offset=0&limit=1000").then((response)=>{
      const json = response.data
      let contentGraph = <DataPreview key={uuid} json={json} title={selected_step.getLabel()}/>
      let contentTable = <div className="table-responsive">
        <DataTable json={ChartUtil.jsonToChart(json.data.contents)} title={selected_step.getLabel()} uuid={selected_step.uuid} selected_data_source_detail={selected_data_source_detail}></DataTable>
      </div>

      const contents = this.props.mast.visualizers.map((visualize,index)=>{
        const content = <Visualizer key={index} frame_uuid={uuid} visualize={visualize} params={{}}/>
        return {title: visualize.label,content:content,parentProps:this.props}
      })

      ModalUtil.emitModal({
        id: Constants.preview.DATASOURCE,
        visible: true,
        contents: contents,
        title: label
      })
      this.setState({
        loading: false
      })
    })
  }

  onClickCSVDownload(e:Event){
    const selected_step = this.getSelectedStep()
    const param = {
        type:"frame",
        uuid: selected_step.uuid,
        ext:"csv"
    }
    APIUtil.get("files",param).then((response)=>{
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

  getSelectedStep ():DataFrameStepModel {
    let {selected_step_ids, nodes} = this.props
    return Graph.getNode(nodes,selected_step_ids[0])
  }

  onHide(){
    this.saveNodes()
    this.saveFlowPorts()
  }

  /**
   * データソースのIN/OUTを保存
   *  */
  saveFlowPorts(){
    const {flow,notify,dismissNotify} = this.props
    FlowUtil.saveFlowSettings(inject_flow_uuid, {ports:flow.ports}, notify, dismissNotify)
  }

  saveNodes(){
    let {nodes} = this.props
    return FlowUtil.saveNodes(inject_flow_uuid,nodes)
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

    if(this.state.loading){
      content = <Loader center={true} absolute={true} fixed={false} visible={true}/>
    }else {

      const numberOfLines = StringUtil.separate(this.props.selected_data_source_detail.numberOfLines)
      const fileSize = StringUtil.convertToFileSize(this.props.selected_data_source_detail.fileSize)
      const lastModifiedAt = StringUtil.separate(this.props.selected_data_source_detail.lastModifiedAt)

      content = <div>
        <div className={style.property_overview}>
          <div className={style.actions}>
            {preview}
            {download}
            <Button onClick={(e) => this.onClickDelete(e)} icon={'delete'}
                    danger={true}>削除</Button>
          </div>
          <div className={style.full_hr}/>
          <div className={style.overviews}>
            <div className={style.overview}>
              <div className={style.overview_label}>
                データの件数
              </div>
              <div className={style.overview_value}>
                {numberOfLines} {/*{property.overview.count || 0}*/}
              </div>
            </div>
            <div className={style.overview}>
              <div className={style.overview_label}>
                ファイルサイズ
              </div>
              <div className={style.overview_value}>
                {fileSize}
              </div>
            </div>
            <div className={style.overview}>
              <div className={style.overview_label}>
                作成日
              </div>
              <div className={style.overview_value}>
                {lastModifiedAt} {/*{property.overview.created_at || ""}*/}
              </div>
            </div>
            <div className={style.overview}>
              <div className={style.overview_label}>
                作成者
              </div>
              <div className={style.overview_value}>
                 {/*{property.overview.created_user_name || ""}*/}
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
        <div className={style.full_hr}/>
        <CommandSelector numberOfInput={1} {...this.props} />
        {/*<div className={style.property_title}>*/}
          {/*作成したフロー*/}
        {/*</div>*/}
        {/*<div>*/}
          {/*<DropDownList list={[{name: 'サブフロー1', value: '1', object: {}}]} />*/}
        {/*</div>*/}
      </div>
    }


    return <BaseInspector header={""}  label={selected_step.label} {...this.props} onBlurTitle={(e)=>this.onBlurTitle(e)} onHide={()=>this.onHide()}>
      {content}
    </BaseInspector>
  }

  onBlurTitle(e:SyntheticInputEvent<EventTarget>){
    const selectedStep = this.getSelectedStep()
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    newSelectedStep.label = e.target.value
    this.props.updateStep(newSelectedStep)
  }

}

export default DataSourceInspector