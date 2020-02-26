//@flow
import React from 'react'
import Constants from 'Constants/index'
import {
  APIUtil,
  ErrorUtil,
  FlowUtil,
  GraphUtil,
  ModalUtil,
  ReactDomUtil,
  SortUtil,
  StateUtil,
  StringUtil
} from 'Utils/index'
import { BaseInspector } from 'Shared/Inspector'
import style from '../style.scss'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import { Button, DownloadButton } from 'Shared/Input'
import { CSVModel, DataFrameStepModel, MessageModel } from 'Model/index'
import { CommandSelector } from "FlowEditorContainer/Command";
import FlowModel from 'Model/Flow/FlowModel'
import type { DataFrameDetailType, MastType } from 'Types/index'
import type { CSVModelProps } from 'Model/CSV/CSVModel'
import { Loader } from 'Shared/Base'
import { Visualizer } from 'Shared/Visualizer'
import type { FlowModelProps } from "Model/Flow/FlowModel";
import { API } from 'Modules/api/index'

type State = {
  dataFrameDetail?: DataFrameDetailType;
  loading: boolean;
}

type DataSourceInspectorProps = {
  nodes: [];
  notify: Function;
  dismissNotify: Function;
  selected_data_source_detail: DataFrameDetailType;
  mast: MastType;
  loadFlowJSON: Function;
  deleteSteps: Function;
  selectSteps: Function;
  addHistory: Function;
  flow: FlowModelProps;
  updateFlow: Function;
  selected_step_ids: [];
  deleteCache: Function;
  updateFlow: Function;
  nodes: [];
  addStep: Function;
  updateStep: Function;
  updateFlow: Function;
}

class DataSourceInspector extends React.Component<DataSourceInspectorProps, State> {

  loading: boolean = false

  constructor(props: FlowEditorProps) {
    super(props)
    this.state = {
      loading: false
    }
  }

  componentWillMount() {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.preview.DATASOURCE, onClickOK: () => {
        ModalUtil.closeModal(Constants.preview.DATASOURCE)
      },
    })
  }

  saveFlow() {
    const { flow, lockUUID, notify, dismissNotify } = this.props

    let saveNotify = notify({
      title: 'フロー保存中',
      message: 'フローの設定を保存しています',
      status: 'loading',
      dismissAfter: 0,
    })

    return new Promise(async (reslove, reject) => {

      await API.request.doPut.flow(
        {
          flowUUID: inject_flow_uuid,
          flow: flow,
          lockUUID: lockUUID
        }
      )
        .then((response) => {
          dismissNotify(saveNotify.id)
          if (response.data.success === true) {
            reslove(response.data)
          } else {
            reject(response.data)
          }
        })
    })
      // 保存失敗した場合、エラーメッセージ出力
      .catch(e => {
        notify({
          title: 'フロー保存エラー',
          message: e.message,
          status: 'error',
          dismissAfter: -1,
          closeButton: true
        })
      })
  }

  onClickPreview(e: Event) {
    const flow_uuid = inject_flow_uuid
    const selected_step = this.getSelectedStep()
    let id = selected_step.id
    let stepIds = []
    stepIds.push(id)
    let visualizers = this.props.mast.visualizers
    visualizers = SortUtil.getSortedContents(visualizers)

    this.setState({
      loading: true
    }, () => {
      this.saveFlow()
        .then((result: any) => {
          if (result.success === true) {
            // preview
            let contents = []
            for (const v of visualizers) {
              let content = { flow_uuid: flow_uuid, stepIds: stepIds, frame_uuid: selected_step.uuid, visualize: v }
              contents.push({ title: v.label, content: content, id: id })
            }
            ModalUtil.emitModal({
              id: Constants.preview.DATASOURCE,
              visible: true,
              contents: contents,
              title: selected_step.getLabel()
            })
          }
        })
        .catch((message) => {
          console.log(message)
        })
        .then(() => {
          this.setState({
            loading: false
          })
          this.updateCache()
        })
    })
  }

  updateCache() {
    APIUtil.get('flows/' + inject_flow_uuid).then((response) => {
      const json = response.data
      this.props.loadFlowJSON(json)
    })
  }

  onClickCSVDownload(e: Event) {
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

  onClickDelete(e: Event) {

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        let { selected_step_ids, nodes } = this.props
        const selected_step = GraphUtil.getNode(nodes, selected_step_ids[0])
        this.props.deleteSteps([selected_step.id])
        this.props.selectSteps()
        this.props.addHistory()
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

  onChangeFlowInOut(e: Event) {
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

  getSelectedStep(): DataFrameStepModel {
    let { selected_step_ids, nodes } = this.props
    return GraphUtil.getNode(nodes, selected_step_ids[0])
  }

  onChangeCacheCheck(e: Event) {

    let selected_step = this.getSelectedStep()
    if (selected_step.isMakeCache()) {
      selected_step.setMakeCache(false)
    } else {
      selected_step.setMakeCache(true)
    }

    let flow: FlowModel = this.props.flow
    this.props.updateFlow(flow)
  }

  onClickDeleteCache() {
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

  deleteCache() {
    const { selected_step_ids } = this.props
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
        const selected_step = this.getSelectedStep()
        if (selected_step.hasData()) {
          //TODO 将来的にはページングなどの対応が必要
          APIUtil.get('frames/' + selected_step.uuid + '?no_contents=1').then((response) => {
            const json = response.data
            this.props.updateDataFrameDetail(json.data)
          })
        } else {
          this.props.updateDataFrameDetail({})
        }
      }
    })
  }

  renderFrameDetail(data_source_detail) {
    let result = null
    if (data_source_detail && data_source_detail.encoding && data_source_detail.newline) {
      result = <React.Fragment>
        <div className={style.overview}>
          <div className={style.overview_label}>
            文字コード
              </div>
          <div className={style.overview_value}>
            {data_source_detail.encoding}
          </div>
        </div>
        <div className={style.overview}>
          <div className={style.overview_label}>
            改行コード
              </div>
          <div className={style.overview_value}>
            {data_source_detail.newline}
          </div>
        </div>
      </React.Fragment>
    }

    return result
  }

  render() {
    const { mast, addStep, selectSteps, selected_step_ids, addHistory, selected_data_source_detail, disabled } = this.props;
    let step_text
    let dataSource
    let preview
    let download
    const selected_step = this.getSelectedStep()
    if (selected_step instanceof DataFrameStepModel) {
      preview = <Button onClick={(e) => this.onClickPreview(e)}
        icon={'visibility'} disabled={disabled}>プレビュー</Button>
      if (selected_step.hasData()) {
        const href = APIUtil.apiUrl("files") + "?type=frame&uuid=" + selected_step.uuid + "&ext=csv&label=" + selected_step.label
        download = <DownloadButton href={href} icon={'get_app'}>CSVダウンロード</DownloadButton>
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


      let fileSize = selected_data_source_detail && selected_data_source_detail.fileSize ? selected_data_source_detail.fileSize : 0
      fileSize = StringUtil.convertToFileSize(fileSize)
      let lastModifiedAt = selected_data_source_detail ? selected_data_source_detail.lastModifiedAt : ""

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
            {this.renderFrameDetail(selected_data_source_detail)}
            <div className={style.overview}>
              <div className={style.overview_label}>
                作成日時
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

              onClick={(e) => { this.onClickDeleteCache() }}>
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
        <CommandSelector
          mast={mast}
          numberOfInput={1}
          selected_step_ids={selected_step_ids}
          addStep={addStep}
          selectSteps={selectSteps}
          addHistory={addHistory}
        />
      </div>
    }

    // FIXIT onBlurTitle to onChange #164
    return <BaseInspector header={''} label={selected_step.label}
      onBlurTitle={(e) => this.onBlurTitle(e)} onHide={() => { }}>
      {content}
    </BaseInspector>
  }

  onBlurTitle(e: SyntheticInputEvent<EventTarget>) {
    const selectedStep = this.getSelectedStep()
    let newSelectedStep = StateUtil.deepCopy(selectedStep)
    newSelectedStep.label = e.target.value
    this.props.updateStep(newSelectedStep)
  }

}

export default DataSourceInspector
