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
import JobList from '../shared/List/JobList'
import JobListHeader from '../shared/List/JobList/JobListHeader'

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */


type State = {
  job_list: [];
  is_loading: boolean;
  is_finished: boolean;
}

export default class LibraryListContainer extends React.Component<Props,State> {

  constructor (props:Props) {
    super(props)
    this.state = {
      job_list: [],
      is_loading: false,
      is_finished: false,
    }
  }

  componentDidMount () {
    this.getJobList()
  }

  getJobList () {
    const self = this
    self.setState({is_loading: true})


    HttpUtil.get('jobs', {project: HttpUtil.getURLParam("project") }).then((response) => {
        const json = response.data
        self.setState(
          {is_loading: false, is_finished: true, job_list: json.data})
      }).catch((error)=>{
        self.setState(
          {is_loading: false, is_finished: true, job_list: []})
    })
  }

  renderJobListHeader () {
    return <JobListHeader/>
  }

  renderJobList () {
    const self = this
    return this.state.job_list.map((job, index) => {
      return <JobList key={index} job={job}/>
    })
  }

  renderEmptyState () {
    return <EmptyState
      icon={'inbox'}
      title={'ライブラリが空です'}
      description={'フローを実行することでデータが作成されます'}>
    </EmptyState>
  }

  // renderSearchBar () {
  //   return <div className={style.search_bar}>
  //     <TextFieldWithButton placeholder={'フローを検索'}
  //                          onChange={(e) => this.onChangeKeyword(
  //                            e)}>検索</TextFieldWithButton>
  //   </div>
  // }
  //
  // onChangeKeyword (e) {
  //   this.setState({keyword: e.target.value})
  // }
  //
  // onChangeFlowName (e) {
  //   this.setState({
  //     flow_name: e.target.value,
  //   })
  // }
  //
  onClickNew (e) {

    console.log("onclick new")
  }
  //
  // onClickDelete (flow_uuid) {
  //   const self = this
  //   HttpUtil.delete('flows/' + flow_uuid).then((response) => {
  //     self.getFlowList()
  //   })
  //
  // }
  //
  isEmptyFlowList () {
    if (!Array.isArray(this.state.job_list) || this.state.job_list.length ===
      0 || this.state.job_list === null) {
      return true
    }
    return false
  }
  //
  // renderNewFlow () {
  //   return <div className={"mt-20px"}><a href="#" onClick={(e) => this.onClickNew(e)}>新しくフローを作成する</a></div>
  // }
  //
  renderAll () {
    if (this.isEmptyFlowList()) {
      return this.renderEmptyState()
    }
    return <div>
      {/*{this.renderSearchBar()}*/}
      {this.renderJobListHeader()}
      {this.renderJobList()}
      {/*{this.renderNewFlow()}*/}
    </div>
  }

  render () {
    return <div className={'container mt-40px'}>
      <Loader center={true} absolute={true} visible={this.state.is_loading}/>
      {this.renderAll()}
      <ModalManager/>
    </div>
  }
}