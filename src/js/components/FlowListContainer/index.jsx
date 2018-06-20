// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import HttpUtil from '../../utils/HttpUtil'
import ProjectList from '../shared/List/ProjectList'
import TextFieldWithButton from '../shared/TextFieldWithButton'
import ProjectListHeader from '../shared/List/ProjectList/ProjectListHeader'
import FlowList from '../shared/List/FlowList'
import ModalManager from '../shared/ModalManager'

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

export default class FlowListContainer extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      flow_list: [],
      keyword: ''
    }
  }

  componentDidMount () {
    const self = this
    HttpUtil.get('flows').then((response) => {
      const json = response.data
      self.setState({flow_list: json.data})
    })
  }

  renderFlowListHeader(){
    return <ProjectListHeader/>
  }

  renderFlowList () {
    if (!Array.isArray(this.state.flow_list)) return this.renderEmptyState()
    const {keyword} = this.state
    return this.state.flow_list.filter((flow) => {
      if(keyword === "")return true
      return (project.name.indexOf(keyword) != -1) ? true : false
    }).map((flow)=>{
      return <FlowList flow={flow} />
    })
  }

  renderEmptyState () {
    return <EmptyState>プロジェクトがありません</EmptyState>
  }

  onChange (e) {
    this.setState({keyword: e.target.value})
  }

  render () {
    return <div className={"container"}>
      <div className={style.search_bar}>
        <TextFieldWithButton placeholder={'フローを検索'} onChange={(e) => this.onChange(e)}>検索</TextFieldWithButton>
      </div>
      {this.renderFlowListHeader()}
      {this.renderFlowList()}
    </div>
  }

}