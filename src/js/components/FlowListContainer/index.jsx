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

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

export default class FlowListContainer extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      flow_list: inject_flow_list,
      keyword: '',
      is_loading: false,
      is_finished: false,
      flow_name: null,
    }
  }


  componentDidMount () {
    this.getFlowList()
    this.registerModal()
  }

  registerModal(){
    //モーダル処理の登録
    const self = this
    ModalUtil.registerModal({
      id: Constants.modal.ADD_FLOW, onClickDone: () => {
        HttpUtil.post("flows",{name:self.state.flow_name,project_uuid:inject_project_uuid,data_source_name:self.state.flow_name}).then((response)=>{
          ModalUtil.emitModal({id: Constants.modal.ADD_FLOW, visible: false})
          self.getFlowList()
        })
      }
    })
  }

  getFlowList(){
    const self = this
    self.setState({is_loading: true})
    HttpUtil.get('flows',{project:inject_project_uuid}).then((response) => {
      const json = response.data
      self.setState({is_loading: false, is_finished: true,flow_list: json.data})
    })
  }

  renderFlowListHeader () {
    return <FlowListHeader/>
  }

  renderFlowList () {
    const {keyword} = this.state
    const self = this
    return this.state.flow_list.filter((flow) => {
      if (keyword === '') return true
      return (flow.name.indexOf(keyword) != -1) ? true : false
    }).map((flow) => {
      return <FlowList flow={flow} href={"./flows/" + flow.uuid}>
        <a href="#" onClick={()=>self.onClickDelete(flow.uuid)}>削除</a>
      </FlowList>
    })
  }

  renderEmptyState () {
    return <EmptyState
      icon={'add'}
      title={'フローがありません'}
      description={'フローを作成しましょう。'}>
      <Button onClick={(e)=>this.onClickNew(e)}>作成する</Button>
    </EmptyState>
  }

  renderSearchBar(){
    return <div className={style.search_bar}>
      <TextFieldWithButton placeholder={'フローを検索'} onChange={(e) => this.onChangeKeyword(e)}>検索</TextFieldWithButton>
    </div>
  }

  onChangeKeyword (e) {
    this.setState({keyword: e.target.value})
  }

  onChangeFlowName(e){
    this.setState({
      flow_name: e.target.value
    })
  }

  onClickNew(e){
    ModalUtil.emitModal({
      id: Constants.modal.ADD_FLOW,
      visible: true,
      done:"作成する",
      content: <div>
        <TextField rules={{
          required:true,
          minlength:5
        }} placeholder={"フロー"} onChange={(e,validation)=>this.onChangeFlowName(e,validation)}/>
      </div>
    })
  }

  onClickDelete(flow_uuid){
    const self = this
    HttpUtil.delete("flows/" + flow_uuid).then((response)=>{
      self.getFlowList()
    })

  }
  isEmptyFlowList(){
    if (!Array.isArray(this.state.flow_list) || this.state.flow_list.length === 0 || this.state.flow_list === null) return true
    return false
  }

  renderNewFlow(){
    return <a href="#" onClick={(e)=>this.onClickNew(e)}>新しくフローを作成する</a>
  }

  renderAll () {
    if(this.isEmptyFlowList()){
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
    return <div className={'container'}>
      <Loader absolute={true} visible={this.state.is_loading}/>
      {this.renderAll()}
      <ModalManager />
    </div>
  }
}