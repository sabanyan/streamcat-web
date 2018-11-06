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

import TabBar from '../shared/TabBar'
import TabList from '../shared/TabBar/TabList'
import Tab from '../shared/TabBar/Tab'
import TabPanel from '../shared//TabBar/TabPanel'
/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

type State = {
  is_loading: boolean;
  is_finished: boolean;
  selected_tab_id: number;
}

export default class ProfileContainer extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      is_loading: false,
      is_finished: false,
      selected_tab_id: 0
    }
  }

  componentDidMount () {
    //  this.getJobList()
  }

  //
  // getJobList () {
  //   const self = this
  //   self.setState({is_loading: true})
  //
  //
  //   HttpUtil.get('jobs', {project: HttpUtil.getURLParam("project") }).then((response) => {
  //       const json = response.data
  //       self.setState(
  //         {is_loading: false, is_finished: true, job_list: json.data})
  //     }).catch((error)=>{
  //       self.setState(
  //         {is_loading: false, is_finished: true, job_list: []})
  //   })
  // }
  //
  // renderJobListHeader () {
  //   return <JobListHeader/>
  // }
  //
  // renderJobList () {
  //   const self = this
  //   return this.state.job_list.map((job, index) => {
  //     return <JobList key={index} job={job}/>
  //   })
  // }
  //
  // renderEmptyState () {
  //   return <EmptyState
  //     icon={'inbox'}
  //     title={'ライブラリが空です'}
  //     description={'フローを実行することでデータが作成されます'}>
  //   </EmptyState>
  // }
  //
  // isEmptyFlowList () {
  //   if(!this.state.is_finished)return false
  //   if (!Array.isArray(this.state.job_list) || this.state.job_list.length ===
  //     0 || this.state.job_list === null) {
  //     return true
  //   }
  //   return false
  // }
  //
  // renderAll () {
  //   if (this.isEmptyFlowList()) {
  //     return this.renderEmptyState()
  //   }
  //   if (!this.state.is_finished)return null
  //   return <div>
  //     {this.renderJobListHeader()}
  //     {this.renderJobList()}
  //   </div>
  // }

  onClickTab(e,tab_id){
    this.setState({selected_tab_id:tab_id})
  }

  render () {

    /**
     * ナビゲーションモデルはAPIから取得予定
     * @type {boolean}
     */
    /*let isLogin = false
    if(window.navigationModel){
      if(window.navigationModel.user_id && window.navigationModel.user_name){
        isLogin = true
      }
    }

    let username
    if(isLogin){
      username = window.navigationModel.user_name
    }*/

    const {selected_tab_id} = this.state

    return <div className={'container mt-40px'}>
      <Loader center={true} absolute={true} visible={this.state.is_loading} />

      <div className={style.page_title}>
        プロフィール
      </div>

      <div>

        <TabBar className={style.tabbar}>
          <TabList>
            <Tab className={style.tab} activeClassName={style.active} tab_id={0} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>ユーザプロフィール</Tab>
            <Tab className={style.tab} activeClassName={style.active} tab_id={1} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>Grafana設定</Tab>
          </TabList>
        </TabBar>

        <TabPanel tab_id={0} selected_tab_id={selected_tab_id} >
          <div className={style.card}>
            <div className={"mb-8px"}>
              <label>ユーザ名</label>
              <TextField placeholder={'ユーザ名'} />
            </div>

            <div className={"mb-8px"}>
              <label>パスワード</label>
              <TextField placeholder={'パスワード'} />
            </div>
            <div className={"text-right mt-20px"}>
              <Button className={"mr-0"}>保存する</Button>
            </div>
          </div>
        </TabPanel>
        <TabPanel tab_id={1} selected_tab_id={selected_tab_id} >
          <div className={style.card}>
            <div className={"mb-8px"}>
            <label>URL</label>
            <TextField className={"mb-0"} placeholder={'Grafana URL'} />
            <small>grafana.com もしくは ホストしている指定のURLを入力してください</small>
            </div>

            <div className={"mb-8px"}>
              <label>ID</label>
              <TextField placeholder={'ID'} />
            </div>

            <div className={"mb-8px"}>
            <label>パスワード</label>
            <TextField placeholder={'パスワード'} />
            </div>
            <div className={"text-right mt-20px"}>
              <Button className={"mr-0"}>保存する</Button>
            </div>
          </div>
        </TabPanel>


      </div>


      <ModalManager />
    </div>
  }
}