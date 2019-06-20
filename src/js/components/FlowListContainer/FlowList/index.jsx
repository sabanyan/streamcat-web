//@flow
import React from 'react'
import type { FlowListProps } from '../index'
import classnames from 'classnames'
import style from './style.scss'
import flowListStyle from 'Shared/ListRow/FlowListRow/style.scss'
import APIUtil from 'Utils/APIUtil'
import { FlowListHeader, FlowListRow } from 'Shared/ListRow'
import { ModalManager } from 'Shared/Modal'
import Constants from 'Constants/index'
import ModalUtil from 'Utils/ModalUtil'
import Loader from 'Shared/Base/Loader'
import EmptyState from 'Shared/Base/EmptyState'
import { Button, FileUploader, TextField } from 'Shared/Input'
import type { FlowListDataType } from 'Types/index'
import { FlowInspector } from 'Shared/Inspector'
import { NotificationManager } from 'Shared/Notification'

type State = {
  flow_list: [FlowListDataType];
  keyword: string;
  is_loading: boolean;
  is_finished: boolean;
  flow_name: string,
  upload_file: UploadedFileType
}

export default class FlowList extends React.Component<FlowListProps, State> {

  constructor (props: FlowListProps) {
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

  componentDidMount () {
    this.getFlowList()
    this.registerModal()
  }

  clearKeyword () {
    this.setState({
      keyword: '',
      selected_flow: null
    })

    const target = document.querySelector('input[type=text]')
    if (target) target.value = ''
  }

  registerModal () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FLOW, onClickDone: () => {
        const {flow_name} = this.state
        const {uuid, label} = this.state.upload_file
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
      },
    })
  }

  getFlowList () {
    //this.setState({is_loading: true})
    APIUtil.get('flows', {project: inject_project_uuid}).then((response) => {
      const json = response.data
      this.setState(
        {is_loading: false, is_finished: true, flow_list: json.data})
    })
  }

  renderFlowListHeader () {
    return <FlowListHeader />
  }

  renderFlowList () {
    const {keyword} = this.state
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

  renderEmptyState () {
    return <EmptyState
      icon={'add'}
      title={'フローがありません'}
      description={'フローを作成しましょう'}>
      <Button onClick={(e) => this.onClickNew(e)}>作成する</Button>
    </EmptyState>
  }

  onClickAddFlowParam () {
    let flow = this.state.selected_flow
    const name = this.setNewParamName('new_param', 1)
    flow.params.push({name: name, type: 'string'})
    this.forceUpdate()
  }

  setNewParamName (name: string, cnt: number): string {
    let flow = this.state.selected_flow

    const findResult = flow.params.find(param => {
      return param.name === (name + cnt)
    })
    if (findResult) {
      return this.setNewParamName(name, cnt + 1)
    }
    return name + cnt
  }

  onClickDeleteParam (param) {

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

  onDeleteParam (param) {
    let flow = this.state.selected_flow
    const newParams = flow.params.filter(p => {
      return (p !== param)
    })
    flow.params = newParams
    this.forceUpdate()
  }

  renderSearchBar () {
    return <div className={style.search_bar}>
      <TextField placeholder={'フローを検索'} onChange={(e) => this.onChangeKeyword(e)} />
    </div>
  }

  onClickFlow (e, flow) {
    this.setState({selected_flow: flow})
    this.props.selectFlow(flow)
  }

  onChangeKeyword (e: SyntheticInputEvent<EventTarget>) {
    this.setState({keyword: e.target.value})
  }

  onChangeFlowName (e: SyntheticInputEvent<EventTarget>) {
    this.setState({
      flow_name: e.target.value,
    })
  }

  onChangeFile (e: SyntheticInputEvent<EventTarget>) {
    const selectedFiles: FileList = e.target.files
    if (selectedFiles) {
      const uploadFile: File = selectedFiles[0]
      APIUtil.frameUpload(uploadFile, uploadFile.name).then((response) => {
        const {success} = response.data
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

  onClickNew (e: SyntheticInputEvent<EventTarget>) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FLOW,
      visible: true,
      done: '作成する',
      content: <div>
        <TextField placeholder={'フロー名'}
                   onChange={(e, validation) => this.onChangeFlowName(e,
                     validation)} />
        <div className={'mt-8px'} />
        <FileUploader accept={['text/csv']} defaultLabel={'ファイルを選択してください'}
                      onChangeFile={(e) => this.onChangeFile(e)} />
      </div>,
    })
  }

  onClickDuplicate (flow_uuid: string) {
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

  onClickDelete (flow_uuid: string) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        APIUtil.delete('flows/' + flow_uuid).then((response) => {
          this.getFlowList()
          ModalUtil.closeModal(Constants.modal.CONFIRM)
        })
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

  onBlurTitle (e, props) {
    const flow = props.flow
    if (flow) {
      APIUtil.put('flows/' + flow.uuid, {
        label: e.target.value
      }).then((response) => {
        this.getFlowList()
      }, (error) => {

      })
    }
  }

  isEmptyFlowList () {
    if (!this.state.is_finished) return false
    if (!Array.isArray(this.state.flow_list) || this.state.flow_list.length === 0 || this.state.flow_list === null) {
      return true
    }
    return false
  }

  renderNewFlow () {
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

  renderInspector () {
    return <FlowInspector
      {...this.props}
      onClickDeleteParam={(param) => this.onClickDeleteParam(param)}
      onClickDuplicate={(uuid) => this.onClickDuplicate(uuid)}
      onBlurTitle={(e, props) => this.onBlurTitle(e, props)}
      onClickAddFlowParam={(e) => this.onClickAddFlowParam(e)}
      onClickDelete={(e) => this.onClickDelete(e)} />
  }

  renderAll () {
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

  render () {

    return <div className={style.inspector_list_container}>
      <div className={'container mt-40px'}>
        <Loader absolute={true} visible={this.state.is_loading} />
        {this.renderAll()}
        <ModalManager {...this.props} />
        <NotificationManager />
      </div>
    </div>
  }
}