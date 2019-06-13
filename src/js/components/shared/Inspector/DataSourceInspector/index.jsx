//@flow
import React from 'react'
import Constants from 'Constants/index'
import ModalUtil from 'Utils/ModalUtil'
import SortUtil from 'Utils/SortUtil'
import { BaseInspector } from 'Shared/Inspector'
import style from '../style.scss'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { Button } from 'Shared/Input'
import { CSVModel, DataFrameStepModel } from 'Model/index'
import { CommandSelector } from 'Shared/Command'
import FlowModel from 'Model/Flow/FlowModel'
import Graph from 'Utils/Graph'
import APIUtil from 'Utils/APIUtil'
import type { DataFrameDetailType } from 'Types/index'
import type { CSVModelProps } from 'Model/CSV/CSVModel'
import Loader from 'Shared/Loader/index'
import FlowUtil from 'Utils/FlowUtil'
import StateUtil from 'Utils/State'
import StringUtil from 'Utils/StringUtil'
import ErrorUtil from 'Utils/ErrorUtil'
import Visualizer from 'Shared/Visualizer'
import ReactDomUtil from 'Utils/ReactDomUtil'

type State = {
  dataFrameDetail?: DataFrameDetailType;
  loading: boolean;
}

class DataSourceInspector extends React.Component<FlowEditorProps, State> {

  loading: boolean = false

  constructor (props: FlowEditorProps) {
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

  onClickPreview (e: Event) {
    const selected_step = this.getSelectedStep()

    let {nodes} = this.props

    FlowUtil.saveNodes(inject_flow_uuid, nodes).then(() => {

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

        const getFramesURL = 'frames?from=' + inject_flow_uuid + '.' + selected_step.id + '&no_contents=1'
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

  previewFromUUID (uuid: string, label: string) {
    const {selected_data_source_detail} = this.props
    const selected_step = this.getSelectedStep()

    //ヘッダー情報の取得

    const getFrameHeaderURL = 'frames/' + uuid
    APIUtil.get(getFrameHeaderURL + '?header_only=1&offset=0&limit=1').then((response) => {
      const headers = response.data.data
      let visualizers = this.props.mast.visualizers
      visualizers = SortUtil.getSortedContents(visualizers)
      let contents = []
      for (const v of visualizers) {
        const content = <Visualizer key={v.order + uuid} frame_uuid={uuid} visualize={v} params={{}}
                                    headers={headers} />
        contents.push({title: v.label, content: content, parentProps: this.props})
      }

      ModalUtil.emitModal({
        id: Constants.preview.DATASOURCE,
        visible: true,
        contents: contents,
        title: label
      })
      this.setState({
        loading: false
      })
      this.updateCache()
    })
  }

  updateCache () {
    APIUtil.get('flows/' + inject_flow_uuid).then((response) => {
      const json = response.data
      this.props.loadFlowJSON(json)
    })
  }

  onClickCSVDownload (e: Event) {
    const selected_step = this.getSelectedStep()
    const param = {
      type: 'frame',
      uuid: selected_step.uuid,
      ext: 'csv',
      label: selected_step.label
    }
    APIUtil.get('files', param).then((response) => {
      let props: CSVModelProps = {
        uuid: selected_step.uuid,
        data: response.data,
      }
      const csv: CSVModel = new CSVModel(props)
      csv.handleDownload()
    })
  }

  onClickDelete (e: Event) {

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let {selected_step_ids, nodes} = this.props
        const selected_step = Graph.getNode(nodes, selected_step_ids[0])
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
    let flow: FlowModel = this.props.flow
    const flowInChecked = this.refs.flowIn.checked
    const flowOutChecked = this.refs.flowOut.checked

    let selected_step = this.getSelectedStep()
    //パラメーターを更新
    const port = {
      label: selected_step.getLabel(),
      nodeId: selected_step.id,
      type: selected_step.type
    }

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

  getSelectedStep (): DataFrameStepModel {
    let {selected_step_ids, nodes} = this.props
    return Graph.getNode(nodes, selected_step_ids[0])
  }

  onHide () {
//    this.saveNodes()
//    this.saveFlowPorts()
  }

  onChangeCacheCheck (e: Event) {

    let selected_step = this.getSelectedStep()
    if (selected_step.isMakeCache()) {
      selected_step.setMakeCache(false)
    } else {
      selected_step.setMakeCache(true)
    }

    let flow: FlowModel = this.props.flow
    this.props.updateFlow(flow)
  }

  onClickDeleteCache () {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.deleteCache()
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })

    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたデータソースのキャッシュを削除しますか？
      </div>,
    })
  }

  deleteCache () {
    const {selected_step_ids} = this.props
    const id = selected_step_ids[0]
    const url = 'caches?of=' + inject_flow_uuid + '.' + id

    APIUtil.delete(url).then((response) => {
      if (!response.data.success) {
        notify({
          title: '実行エラー',
          message: ReactDomUtil.renderToString(ErrorUtil.getErrorBody(response)),
          status: 'error',
          dismissAfter: 0,
          closeButton: true
        })
      }
      if (response.data.success) {
        this.props.deleteCache(id)
      }
    })
  }

  /**
   * データソースのIN/OUTを保存
   *  */
  saveFlowPorts () {
    const {flow, notify, dismissNotify} = this.props
    FlowUtil.saveFlowSettings(inject_flow_uuid, {ports: flow.ports}, notify, dismissNotify)
  }

  saveNodes () {
    let {nodes} = this.props
    return FlowUtil.saveNodes(inject_flow_uuid, nodes)
  }

//
//  /**
//   * データソースのIN/OUTを保存
//   *  */
//  saveFlowPorts(){
//    const {flow,notify,dismissNotify} = this.props
//    FlowUtil.saveFlowSettings(inject_flow_uuid, {ports:flow.ports}, notify, dismissNotify)
//  }
//
//  saveNodes(){
//    let {nodes,history} = this.props
//    const isSame = FlowUtil.isSameCurrentNodesToBeforeHistoryNodes(history,nodes)
//    if(isSame){
//      return
//    }
//    return FlowUtil.saveNodes(inject_flow_uuid,nodes)
//  }

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

    const flow: FlowModel = this.props.flow
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
    const cacheCheckForm = <div>
      <div>
        <label><input type="checkbox" checked={selected_step.makeCache ? 'checked' : ''}
                      ref={'cache'} disabled=""
                      onChange={(e) => this.onChangeCacheCheck(e)} />
        </label>
      </div>
    </div>

    let content

    if (this.state.loading) {
      content = <Loader center={true} absolute={true} fixed={false} visible={true} />
    } else {

      const fileSize = StringUtil.convertToFileSize(this.props.selected_data_source_detail.fileSize)
      const lastModifiedAt = this.props.selected_data_source_detail.lastModifiedAt
      content = <div>
        <div className={style.property_overview}>
          <div className={style.actions}>
            {preview}
            {download}
            <Button onClick={(e) => this.onClickDelete(e)} icon={'delete'}
                    danger={true}>削除</Button>
          </div>
          <div className={style.full_hr} />
          <div className={style.overviews}>
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
        <div className={style.cache}>
          <div className={style.cache_label}>
            結果をキャッシュ
          </div>
          <div className={style.cache_value}>
            {cacheCheckForm}
          </div>
          <div className={style.cache_delete}>
            <Button icon={'delete'} danger={true}
                    disabled={!selected_step.isCached()}

                    onClick={(e) => {this.onClickDeleteCache()}}>
              キャッシュ削除
            </Button>
          </div>
          <div className={style.cache_label}>
            キャッシュ作成日
          </div>
          <div className={style.cache_value}>
            {selected_step.cacheCreatedAt}
          </div>
        </div>
        <div className={style.full_hr} />
        <CommandSelector numberOfInput={1} {...this.props} />
        {/*<div className={style.property_title}>*/}
        {/*作成したフロー*/}
        {/*</div>*/}
        {/*<div>*/}
        {/*<DropDownList list={[{name: 'サブフロー1', value: '1', object: {}}]} />*/}
        {/*</div>*/}
      </div>
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector header={''} label={selected_step.label} {...this.props}
                          onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => this.onHide()}>
      {content}
    </BaseInspector>
  }

  onBlurTitle (e: SyntheticInputEvent<EventTarget>) {
    const selectedStep = this.getSelectedStep()
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    newSelectedStep.label = e.target.value
    this.props.updateStep(newSelectedStep)
    // 該当ステップがIn・OutPortの場合の処理
    let flow: FlowModel = this.props.flow
    const flowInChecked = (this.refs.flowIn) ? this.refs.flowIn.checked : null
    const flowOutChecked = (this.refs.flowOut) ? this.refs.flowOut.checked : null
    const id = selectedStep.id

    if (flowInChecked || flowOutChecked) {
      if (flowInChecked) {
        let inPort = flow.getInPortWithId(id)
        inPort.label = newSelectedStep.label
        flow.setInPort(inPort)
      }

      if (flowOutChecked) {
        let outPort = flow.getOutPortWithId(id)
        outPort.label = newSelectedStep.label
        flow.setOutPort(outPort)
      }

      this.props.updateFlow(flow)
    }
  }

}

export default DataSourceInspector
