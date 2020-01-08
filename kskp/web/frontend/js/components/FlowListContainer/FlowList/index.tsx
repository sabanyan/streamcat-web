import React from 'react'
import axios from 'axios'

import { API } from 'Modules/api/index'
import style from './style.scss'


import { FlowListProps } from '../index'
import { FlowListDataType } from 'Types/index'
import classnames from 'classnames'
import flowListStyle from 'Shared/ListRow/FlowListRow/style.scss'
import { APIUtil, ModalUtil } from 'Utils/index'
import { FlowListHeader, FlowListRow } from 'Shared/ListRow'
import { ModalManager } from 'Shared/Modal'
import Constants from 'Constants/index'
import { EmptyState, Loader } from 'Shared/Base'
import { Button, TextField } from 'Shared/Input'
import { FlowInspector } from 'Shared/Inspector'
import { NotificationManager } from 'Shared/Notification'
import { UploadedFileType } from 'Types/index'

type State = {
  flow_list: FlowListDataType[];
  keyword: string;
  is_loading: boolean;
  is_finished: boolean;
  flow_name: string,
  upload_file: UploadedFileType,
  selected_flow: any
}

export default class FlowList extends React.Component<FlowListProps, State> {

  constructor(props: FlowListProps) {
    super(props)
    this.state = {
      flow_list: [],
      keyword: '',
      is_loading: false,
      is_finished: false,
      flow_name: '',
      upload_file: {},
      selected_flow: null
    }
  }

  componentDidMount() {
    this.getFlowList()
    this.registerModal()
  }

  clearKeyword() {
    this.setState({
      keyword: '',
      selected_flow: null
    })

    const target: any = document.querySelector('input[type=text]')
    if (target) target.value = ''
  }

  registerModal() {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FLOW, onClickDone: () => {
        const { flow_name } = this.state
        const { uuid, label } = this.state.upload_file
        if (!flow_name) {
          alert('フロー名を入力してください')
          return false
        }
        APIUtil.post('flows', {
          name: flow_name,
          project_uuid: inject_project_uuid,
          datasource: {
            'uuid': uuid,
            'label': label,
            'type': 'frame'
          }
        }).then((response) => {
          ModalUtil.closeModal(Constants.modal.ADD_FLOW)
          this.clearKeyword()
          this.getFlowList()
        })
        return true
      },
    })
  }

  getFlowList() {
    //this.setState({is_loading: true})
    APIUtil.get('flows', { project: inject_project_uuid }).then((response) => {
      const json = response.data
      let selected_flow = this.state.selected_flow
      if (selected_flow) {
        selected_flow = json.data.find((flow) => {
          return (flow.uuid === selected_flow.uuid)
        })
      }
      this.setState(
        { is_loading: false, is_finished: true, flow_list: json.data, selected_flow: selected_flow }, () => {
          this.forceUpdate()
        })
    })
  }

  renderFlowListHeader() {
    return <FlowListHeader />
  }

  renderFlowList() {
    const { keyword } = this.state
    return this.state.flow_list.filter((flow: FlowListDataType) => {
      if (keyword === '') {
        return true
      }
      return (flow.label.indexOf(keyword) != -1) ? true : false
    }).map((flow, index) => {
      const selected = (this.state.selected_flow === flow)
      return <FlowListRow key={index}
        flow={flow}
        href={'./flows/' + flow.uuid}
        selected={selected}
        onClickFlow={(e, flow) => this.onClickFlow(e, flow)}>
        {/*<a href="#" onClick={() => this.onClickDelete(flow.uuid)}>削除</a>*/}
      </FlowListRow>
    })
  }

  renderEmptyState() {
    return <EmptyState
      icon={'add'}
      title={'フローがありません'}
      description={'フローを作成しましょう'}>
      <Button onClick={(e) => this.onClickNew(e)}>作成する</Button>
    </EmptyState>
  }

  onClickAddFlowParam() {
    let flow = this.state.selected_flow
    const name = this.setNewParamName('new_param', 1)
    flow.params.push({ name: name, type: 'string' })
    this.forceUpdate()
  }

  setNewParamName(name: string, cnt: number): string {
    let flow = this.state.selected_flow

    const findResult = flow.params.find(param => {
      return param.name === (name + cnt)
    })
    if (findResult) {
      return this.setNewParamName(name, cnt + 1)
    }
    return name + cnt
  }

  onClickDeleteParam(param) {

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        this.onDeleteParam(param)
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたフロー変数を削除しますか？
      </div>,
    })
  }

  onDeleteParam(param) {
    let flow = this.state.selected_flow
    const newParams = flow.params.filter(p => {
      return (p !== param)
    })
    flow.params = newParams
    this.forceUpdate()
  }

  renderSearchBar() {
    return <div className={style.search_bar}>
      <TextField placeholder={'フローを検索'} onChange={(e) => this.onChangeKeyword(e)} />
    </div>
  }

  onClickFlow(e, flow) {
    this.setState({ selected_flow: flow })
    // 本当に存在するフローなのか確認
    APIUtil.get('flows/' + flow.uuid).then((response) => {
      this.props.selectFlow(flow)
    }, (err) => {
      console.log(err)
    })
  }

  onChangeKeyword(e: any) {
    this.setState({ keyword: e.target.value })
  }

  onChangeFlowName(e: any) {
    this.setState({ flow_name: e.target.value })
  }

  onChangeFile(e: any) {
    const selectedFiles: FileList = e.target.files
    if (selectedFiles) {
      const uploadFile: File = selectedFiles[0]
      APIUtil.frameUpload(uploadFile, uploadFile.name).then((response) => {
        const { success } = response.data
        const json = response.data
        if (success) {
          this.setState({
            upload_file: {
              file: uploadFile,
              uuid: json.data.uuid,
              label: json.data.label
            }
          })
        }
      })
    }
  }

  onClickNew(e: any) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FLOW,
      visible: true,
      done: '作成する',
      content: <div>
        <TextField placeholder={'フロー名'}
          onChange={(e, validation) => this.onChangeFlowName(e)} />
        <div className={'mt-8px'} />
      </div>,
    })
  }

  onClickDuplicate(flow_uuid: string) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        const data = {
          original_flow_uuid: flow_uuid
        }
        APIUtil.post('flows', data).then((response) => {
          this.getFlowList()
          ModalUtil.closeModal(Constants.modal.CONFIRM)
        })
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '複製する',
      danger: false,
      content: <div>
        選択されたフローを複製しますか？
      </div>,
    })
  }

  onClickDelete(flow_uuid: string) {
    const { notify } = this.props

    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {

        const promisedTask = API.request.doDelete.flow
        const promisedProps = {
          flowUUID: flow_uuid
        }
        API.do.lockedDo(
          flow_uuid,
          API.request.doDelete.flow,
          promisedProps
        )
        .then(() => {
          this.getFlowList()
        })
        .catch((err) => {
          notify({
            title: err.title,
            message: err.message,
            status: err.messageStatus,
            dismissAfter: 0,
            closeButton: true
          })
          console.log(err)
        })
        ModalUtil.closeModal(Constants.modal.CONFIRM)
      },
    })
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたフローを削除しますか？
      </div>,
    })
  }

  onBlurTitle(e, flow) {
    const { notify } = this.props
    try {
      const label = e.currentTarget.value
      if (!label) throw "undefined label"
      if (!flow) throw "undefined flow"

      flow.label = label
      const promisedTask = API.request.doPut.flow
      const promisedProps = {
        flowUUID: flow.uuid,
        flow: flow
      }
      API.do.lockedDo(
        flow.uuid,
        promisedTask,
        promisedProps
      )
      .then(() => {
        this.getFlowList()
      })
      .catch(e => {
        notify({
          title: e.title,
          message: e.message,
          status: 'error',
          dismissAfter: -1,
          closeButton: true
        })
      })
    } catch (e) {
      console.log(e)
    }
  }

  isEmptyFlowList() {
    if (!this.state.is_finished) return false
    if (!Array.isArray(this.state.flow_list) || this.state.flow_list.length === 0 || this.state.flow_list === null) {
      return true
    }
    return false
  }

  renderNewFlow() {
    return <a className={classnames(flowListStyle.flow, flowListStyle.new)} href="#"
      onClick={(e) => this.onClickNew(e)}>
      <div className={flowListStyle.flow_list}>
        <div className={flowListStyle.name}>
          <i className={classnames('material-icons', [flowListStyle.icon])}>add_circle_outline</i>
          新しくフローを作成する
        </div>
      </div>
    </a>
  }

  renderInspector() {
    const { runArgs, updateRunArgs, flow, notify, dismissNotify } = this.props;
    return <FlowInspector
      onClickDelete={(e) => this.onClickDelete(e)}
      onClickDuplicate={(uuid) => this.onClickDuplicate(uuid)}
      onBlurTitle={(e, props) => this.onBlurTitle(e, props)}
      runArgs={runArgs}
      updateRunArgs={updateRunArgs}
      flow={this.state.selected_flow}
      notify={notify}
      dismissNotify={dismissNotify} />

    // FlowInspector側で未使用のため削除
    // onClickDeleteParam={(param) => this.onClickDeleteParam(param)}
    // onClickAddFlowParam={(e) => this.onClickAddFlowParam(e)}
  }

  renderAll() {
    if (this.isEmptyFlowList()) {
      return this.renderEmptyState()
    }
    if (!this.state.is_finished) return null
    return <div>
      {this.renderSearchBar()}
      {this.renderFlowListHeader()}
      {this.renderFlowList()}
      {this.renderNewFlow()}
      {this.renderInspector()}
    </div>
  }

  render() {
    return <div className={style.inspector_list_container}>
      <div className={'container mt-40px'}>
        <Loader absolute={true} visible={this.state.is_loading} />
        {this.renderAll()}
        <ModalManager />
        <NotificationManager />
      </div>
    </div>
  }
}