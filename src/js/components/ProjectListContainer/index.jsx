// @flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import HttpUtil from '../../utils/HttpUtil'
import ProjectList from '../shared/List/ProjectList'
import TextFieldWithButton from '../shared/TextFieldWithButton'
import ProjectListHeader from '../shared/List/ProjectList/ProjectListHeader'
import Loader from '../shared/Loader'
import EmptyState from '../shared/EmptyState'
import Button from '../shared/Button'
import ModalManager from '../shared/ModalManager'
import Constants from '../../constants'
import ModalUtil from '../../utils/ModalUtil'
import TextField from '../shared/TextField'

/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

export default class ProjectListContainer extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      project_list: [],
      keyword: '',
      is_loading: false,
      is_finished: false,
      project_name: null,
    }
  }

  componentDidMount () {
    this.getProjectList()
    this.registerModal()
  }

  registerModal () {
    //モーダル処理の登録
    const self = this
    ModalUtil.registerModal({
      id: Constants.modal.ADD_PROJECT, onClickDone: () => {
        HttpUtil.post('projects', {name: self.state.project_name}).
          then((response) => {
            ModalUtil.emitModal(
              {id: Constants.modal.ADD_PROJECT, visible: false})
            self.getProjectList()
          })
      },
    })
  }

  getProjectList () {
    const self = this
    self.setState({is_loading: true})
    HttpUtil.get('projects').then((response) => {
      const json = response.data
      self.setState(
        {is_loading: false, is_finished: true, project_list: json.data})
    })
  }

  renderProjectListHeader () {
    return <ProjectListHeader/>
  }

  renderProjectList () {
    const {keyword} = this.state
    const self = this
    return this.state.project_list.filter((project) => {
      if (keyword === '') {
        return true
      }
      return (project.name.indexOf(keyword) != -1) ? true : false
    }).map((project) => {
      return <ProjectList project={project}
                          href={'./flows?project=' + project.uuid}>
        <a href="#" onClick={() => self.onClickDelete(project.uuid)}>削除</a>
      </ProjectList>
    })
  }

  renderEmptyState () {
    return <EmptyState
      icon={'add'}
      title={'プロジェクトがありません'}
      description={'プロジェクトを作成すると、フローを作成することができるようになります。'}>
      <Button onClick={(e) => this.onClickNew(e)}>作成する</Button>
    </EmptyState>
  }

  renderSearchBar () {
    return <div className={style.search_bar}>
      <TextFieldWithButton placeholder={'プロジェクトを検索'}
                           onChange={(e) => this.onChangeKeyword(
                             e)}>検索</TextFieldWithButton>
    </div>
  }

  onChangeKeyword (e) {
    this.setState({keyword: e.target.value})
  }

  onChangeProjectName (e) {
    this.setState({
      project_name: e.target.value,
    })
  }

  onClickNew (e) {
    ModalUtil.emitModal({
      id: Constants.modal.ADD_PROJECT,
      visible: true,
      done: '作成する',
      content: <div>
        <TextField rules={{
          required: true,
          minlength: 5,
        }} placeholder={'プロジェクト名'}
                   onChange={(e, validation) => this.onChangeProjectName(e,
                     validation)}/>
      </div>,
    })
  }

  onClickDelete (project_uuid) {
    const self = this
    HttpUtil.delete('projects/' + project_uuid).then((response) => {
      self.getProjectList()
    })
  }

  isEmptyProjectList () {
    if (!Array.isArray(this.state.project_list) ||
      this.state.project_list.length === 0 || this.state.project_list ===
      null) {
      return true
    }
    return false
  }

  renderNewProject () {
    return <div className={"mt-20px"}><a href="#" onClick={(e) => this.onClickNew(e)}>新しくプロジェクトを作成する</a></div>
  }

  renderAll () {
    if (this.isEmptyProjectList()) {
      return this.renderEmptyState()
    }
    return <div>
      {this.renderSearchBar()}
      {this.renderProjectListHeader()}
      {this.renderProjectList()}
      {this.renderNewProject()}
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