//@flow
import React from 'react'
import type { FlowListProps } from '../index'
import classnames from 'classnames'
import style from './style.scss'
import flowListStyle from '../../shared/List/FlowList/style.scss'
import APIUtil from '../../../utils/APIUtil'
import FlowListRow from '../../shared/List/FlowList'
import FlowListHeader from '../../shared/List/FlowList/FlowListHeader'
import ModalManager from '../../shared/ModalManager'
import Constants from '../../../constants'
import ModalUtil from '../../../utils/ModalUtil'
import Loader from '../../shared/Loader'
import EmptyState from '../../shared/EmptyState'
import Button from '../../shared/Button'
import TextField from '../../shared/TextField'
import FileUploader from '../../shared/FileUploader'
import { FlowListDataType } from '../../../types'
import FlowInspector from '../../shared/Inspector/FlowInspector'
import FlowUtil from '../../../utils/FlowUtil'
import NotificationManager from '../../shared/NotificationManager'
import ReactDomUtil from '../../../utils/ReactDomUtil'

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

type State = {
  flow_list: [FlowListDataType];
  keyword: string;
  is_loading: boolean;
  is_finished: boolean;
  flow_name: string,
  upload_file: UploadedFileType
}

export default class FlowList extends React.Component<FlowListProps,State> {

  constructor (props:FlowListProps) {
    super(props)
    this.state = {
      flow_list: [],
      keyword: '',
      is_loading: false,
      is_finished: false,
      flow_name: '',
      upload_file: {
      },
      selected_flow:null
    }
  }

  componentDidMount () {
    this.getFlowList()
    this.registerModal()
  }

  
  clearKeyword(){
    this.setState({
      keyword: '',
      selected_flow: null
    })

    const target = document.querySelector("input[type=text]")
    if(target)target.value="";
  }
    
  registerModal () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FLOW, onClickDone: () => {
        const {flow_name} = this.state
        const {uuid,label} = this.state.upload_file
        APIUtil.post('flows', {
          name: flow_name,
          project_uuid: inject_project_uuid,
          datasource: {
            "uuid": uuid,
            "label": label,
            "type": "frame"
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
    this.setState({is_loading: true})
    APIUtil.get('flows', {project: inject_project_uuid}).then((response) => {
      const json = response.data
      this.setState(
        {is_loading: false, is_finished: true, flow_list: json.data})
    })
  }
    
  renderFlowListHeader () {
    return <FlowListHeader/>
  }
    
  renderFlowList () {
    const {keyword} = this.state
    return this.state.flow_list.filter((flow:FlowListDataType) => {
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
        onClickFlow={(e,flow)=>this.onClickFlow(e,flow)}>
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
    
  onClickRun() {
    let {notify, dismissNotify} = this.props
    let flow = this.state.selected_flow
    let flow_uuid = flow.uuid
    let params = flow.params
    
    let putbody = {}
    if(params)putbody["params"]=params

    FlowUtil.saveFlow(flow_uuid, putbody, notify, dismissNotify).then((response) => {
      if (response.data.success) {
        FlowUtil.runNodes(flow_uuid, notify, dismissNotify).then((response) => {
          if (response.data.success) {
            const json: RunResponseType = response.data
            const result = json.name.map((n, index) => {
              return <li key={index}>{n.id}</li>
            })
            const content = <div>
              <div>ライブラリにフローの実行結果が追加されました。</div>
              <ul>{result}</ul>
            </div>
  
            this.props.notify({
              title: 'フロー実行完了',
              message: ReactDomUtil.renderToString(content),
              status: 'success',
              dismissAfter: 0,
              buttons: [
                {
                  name: '開く',
                  primary: true,
                  onClick: () => {
                    window.open('/library?project=' +
                      window.navigationModel.project_uuid, '_blank')
                  },
                }],
            })
          }
        })
      }
    }) 
  }

  onClickAddFlowParam() {
    let flow = this.state.selected_flow
    const name = this.setNewParamName("new_param",1)
    flow.params.push({name:name,type:"string"})
    this.forceUpdate()
  }

  setNewParamName(name:string,cnt:number):string{
    let flow = this.state.selected_flow

    const findResult = flow.params.find(param=>{
      return param.name === (name + cnt)
    })
    if(findResult){
      return this.setNewParamName(name,cnt+1)
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

  onDeleteParam(param){
    let flow = this.state.selected_flow
    const newParams = flow.params.filter(p=>{
      return(p !== param)
    })
    flow.params = newParams
    this.forceUpdate();
  }

  renderSearchBar () {
    return <div className={style.search_bar}>
      <TextField placeholder={'フローを検索'} onChange={(e) => this.onChangeKeyword(e)}/>
    </div>
  }

  onClickFlow(e,flow){
    this.setState({selected_flow:flow})
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
    const selectedFiles:FileList = e.target.files
    if(selectedFiles){
      const uploadFile:File = selectedFiles[0]
      APIUtil.fileupload(uploadFile,uploadFile.name).then((response)=>{
        const json = response.data
        this.setState({upload_file:{
          file:uploadFile,
          uuid:json.data.uuid,
          label:json.data.label
        }})
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
    
  onClickDuplicate (flow_uuid:string){
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        const data = {
          original_flow_uuid: flow_uuid
        }
        APIUtil.post('flows',data).then((response) => {
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
    
  onClickDelete (flow_uuid:string) {
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

  onBlurTitle(e){
    const flow = this.state.selected_flow
    APIUtil.put("flows/" + flow.uuid,{
      label: e.target.value
    }).then((response)=>{
      this.getFlowList()
    },(error)=>{
    
    })
  }
    
  isEmptyFlowList () {
    if(!this.state.is_finished)return false
    if (!Array.isArray(this.state.flow_list) || this.state.flow_list.length ===
    0 || this.state.flow_list === null) {
      return true
    }
    return false
  }

  renderNewFlow () {
    return <a className={classnames(flowListStyle.flow,flowListStyle.new)} href="#" onClick={(e) => this.onClickNew(e)}>
      <div className={flowListStyle.flow_list}>
      <div className={flowListStyle.name}>
      <i className={classnames('material-icons', [flowListStyle.icon])}>add_circle_outline</i>
      新しくフローを作成する
      </div>
      </div>
    </a>
  }

  renderInspector(){
    return <FlowInspector flow={this.state.selected_flow}
      onClickRun={(e)=>this.onClickRun(e)}
      onClickDeleteParam={(param)=>this.onClickDeleteParam(param)}
      onClickDuplicate={(uuid)=>this.onClickDuplicate(uuid)}
      onBlurTitle={(e)=>this.onBlurTitle(e)}
      onClickAddFlowParam={(e)=>this.onClickAddFlowParam(e)}/>
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
      <Loader absolute={true} visible={this.state.is_loading}/>
      {this.renderAll()}
      <ModalManager/>
        <NotificationManager />
    </div>
    </div>
  }
}