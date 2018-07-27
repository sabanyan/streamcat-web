// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import HttpUtil from '../../utils/HttpUtil'
import FlowList from '../shared/List/FlowList'
import FlowListHeader from '../shared/List/FlowList/FlowListHeader'
import TextFieldWithButton from '../shared/TextFieldWithButton'
import ModalManager from '../shared/ModalManager'
import Constants from '../../constants'
import ModalUtil from '../../utils/ModalUtil'
import Loader from '../shared/Loader'
import EmptyState from '../shared/EmptyState'
import Button from '../shared/Button'
import TextField from '../shared/TextField'
import FileUploader from '../shared/FileUploader'

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

type Props = {}
type State = {
  flow_list: [];
  keyword: string;
  is_loading: boolean;
  is_finished: boolean;
  flow_name: ?string;
  files: ?FileList;
}

export default class FlowListContainer extends React.Component<Props,State> {

  constructor (props:Props) {
    super(props)
    this.state = {
      flow_list: inject_flow_list,
      keyword: '',
      is_loading: false,
      is_finished: false,
      flow_name: null,
      files: null
    }
  }

  componentDidMount () {
    this.getFlowList()
    this.registerModal()
  }

  registerModal () {
    //モーダル処理の登録
    const self = this
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FLOW, onClickDone: () => {
        HttpUtil.post('flows', {
          name: self.state.flow_name,
          project_uuid: inject_project_uuid
        }).then((response) => {
          ModalUtil.emitModal({id: Constants.modal.ADD_FLOW, visible: false})
          self.getFlowList()
        })
      },
    })
  }

  getFlowList () {
    const self = this
    self.setState({is_loading: true})
    HttpUtil.get('flows', {project: inject_project_uuid}).then((response) => {
      const json = response.data
      self.setState(
        {is_loading: false, is_finished: true, flow_list: json.data})
    })
  }

  renderFlowListHeader () {
    return <FlowListHeader/>
  }

  renderFlowList () {
    const {keyword} = this.state
    const self = this
    return this.state.flow_list.filter((flow) => {
      if (keyword === '') {
        return true
      }
      return (flow.name.indexOf(keyword) != -1) ? true : false
    }).map((flow, index) => {
      return <FlowList key={index} flow={flow} href={'./flows/' + flow.uuid}>
        <a href="#" onClick={() => self.onClickDelete(flow.uuid)}>削除</a>
      </FlowList>
    })
  }

  renderEmptyState () {
    return <EmptyState
      icon={'add'}
      title={'フローがありません'}
      description={'フローを作成しましょう。'}>
      <Button onClick={(e) => this.onClickNew(e)}>作成する</Button>
    </EmptyState>
  }

  renderSearchBar () {
    return <div className={style.search_bar}>
      <TextField placeholder={'フローを検索'} onChange={(e) => this.onChangeKeyword(e)}/>
    </div>
  }

  onChangeKeyword (e:SyntheticInputEvent<EventTarget>) {
    this.setState({keyword: e.target.value})
  }

  onChangeFlowName (e:SyntheticInputEvent<EventTarget>) {
    this.setState({
      flow_name: e.target.value,
    })
  }

  onChangeFile(e:SyntheticInputEvent<EventTarget>){
    const selectedFiles:FileList =  e.target.files
    if(selectedFiles){
      this.setState({
        files: e.target.files,
      })

      const uploadFile:File = selectedFiles[0]
      const options = {
        headers: { 'enctype': 'multipart/form-data' }
      }

      let formData:FormData = new FormData();
      formData.append('file', uploadFile)
      formData.append('file_name', uploadFile.name)

      console.log(uploadFile)
      HttpUtil.post('frames', formData,options).then((response) => {
        console.log(response)
      })
    }
  }

  onClickNew (e:SyntheticInputEvent<EventTarget>) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FLOW,
      visible: true,
      done: '作成する',
      content: <div>
        <TextField rules={{
          required: true,
          minlength: 5,
        }} placeholder={'フロー'}
                   onChange={(e, validation) => this.onChangeFlowName(e,
                     validation)} />
        <FileUploader accept={['text/csv']} defaultLabel={'ファイルを選択してください'}
                      onChangeFile={(e) => this.onChangeFile(e)} />
      </div>,
    })
  }

  onClickDelete (flow_uuid:string) {
    const self = this
    HttpUtil.delete('flows/' + flow_uuid).then((response) => {
      self.getFlowList()
    })

  }

  isEmptyFlowList () {
    if (!Array.isArray(this.state.flow_list) || this.state.flow_list.length ===
      0 || this.state.flow_list === null) {
      return true
    }
    return false
  }

  renderNewFlow () {
    return <div className={"mt-20px"}><a href="#" onClick={(e) => this.onClickNew(e)}>新しくフローを作成する</a></div>
  }

  renderAll () {
    if (this.isEmptyFlowList()) {
      return this.renderEmptyState()
    }
    return <div>
      {this.renderSearchBar()}
      {this.renderFlowListHeader()}
      {this.renderFlowList()}
      {this.renderNewFlow()}
    </div>
  }

  render () {
    return <div className={'container mt-40px'}>
      <Loader absolute={true} visible={this.state.is_loading}/>
      {this.renderAll()}
      <ModalManager/>
    </div>
  }
}