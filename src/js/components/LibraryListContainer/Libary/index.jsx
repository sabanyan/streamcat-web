//@flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import HttpUtil from '../../../utils/HttpUtil'
import TextFieldWithButton from '../../shared/TextFieldWithButton'
import ModalManager from '../../shared/ModalManager'
import Loader from '../../shared/Loader'
import EmptyState from '../../shared/EmptyState'
import Button from '../../shared/Button'
import TextField from '../../shared/TextField'
import JobList from '../../shared/List/JobList'
import JobListHeader from '../../shared/List/JobList/JobListHeader'
import LibraryInspector from '../../shared/Inspector/LibraryInspector'

type State = {
  libraries: [];
  is_loading: boolean;
  is_finished: boolean;
  selected_data: {};
}

export default class Library extends React.Component<Props,State> {

  constructor (props:Props) {
    super(props)
    this.state = {
      job_list: [],
      is_loading: false,
      is_finished: false,
      selected_data: null
    }
  }

  componentDidMount () {
    this.getJobList()
  }

  getJobList () {
    const self = this
    self.setState({is_loading: true})


    //仮

    const directoryA = {
      type: "directory",
      label: "資料",
      creator: "山田太郎",
      created_at: "2019-01-01 10:01:01"
    }
    const directoryB= {
      type: "directory",
      label: "実行結果",
      creator: "山田太郎",
      created_at: "2019-01-01 10:04:01"
    }
    const directoryC= {
      type: "directory",
      label: "アップロードファイル",
      creator: "山田太郎",
      created_at: "2019-01-01 10:06:01"
    }


    self.setState({is_finished: true})
    self.setState({
      libraries:[
        directoryA,directoryB,directoryC
      ]
    })

    // HttpUtil.get('jobs', {project: HttpUtil.getURLParam("project") }).then((response) => {
    //     const json = response.data
    //     self.setState(
    //       {is_loading: false, is_finished: true, job_list: json.data})
    //   }).catch((error)=>{
    //     self.setState(
    //       {is_loading: false, is_finished: true, job_list: []})
    // })
  }

  renderJobListHeader () {
    return <JobListHeader/>
  }

  renderJobList () {
    const self = this
    return this.state.job_list.map((job, index) => {
      const selected = (this.state.selected_data === job)
      return <JobList key={index}
                      job={job}
                      selected={selected}
                      onClickJob={(e,job)=>this.onClickJob(e,job)}/>
    })
  }

  renderLibrariesHeader () {
    return <JobListHeader/>
  }
  renderLibraries(){
    const self = this
    return this.state.job_list.map((job, index) => {
      const selected = (this.state.selected_data === job)
      return <JobList key={index}
                      job={job}
                      selected={selected}
                      onClickJob={(e,job)=>this.onClickJob(e,job)}/>
    })
  }

  renderEmptyState () {
    return <EmptyState
      icon={'inbox'}
      title={'ライブラリが空です'}
      description={'フローを実行することでデータが作成されます'}>
    </EmptyState>
  }

  onClickLibrary(e,library){
    console.log(job)
    this.setState({selected_data:library})
  }

  isEmptyFlowList () {
    if(!this.state.is_finished)return false
    if (!Array.isArray(this.state.job_list) || this.state.job_list.length ===
      0 || this.state.job_list === null) {
      return true
    }
    return false
  }


  renderInspector(){
    return <LibraryInspector data={this.state.selected_data}/>
  }

  renderAll () {
    if (this.isEmptyFlowList()) {
      return this.renderEmptyState()
    }
    if (!this.state.is_finished)return null
    return <div>
      {/*{this.renderJobListHeader()}*/}
      {/*{this.renderJobList()}*/}
      {this.renderInspector()}
    </div>
  }

  render () {
    return <div className={style.inspector_list_container}>
      <div className={'container mt-40px'}>
      <Loader center={true} absolute={true} visible={this.state.is_loading}/>
      {this.renderAll()}
      <ModalManager/>
    </div>
    </div>
  }
}