//@flow
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

  isEmptyFlowList () {
    if(!this.state.is_finished)return false
    if (!Array.isArray(this.state.job_list) || this.state.job_list.length ===
      0 || this.state.job_list === null) {
      return true
    }
    return false
  }

  renderAll () {
    if (this.isEmptyFlowList()) {
      return this.renderEmptyState()
    }
    if (!this.state.is_finished)return null
    return <div>
      {this.renderJobListHeader()}
      {this.renderJobList()}
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