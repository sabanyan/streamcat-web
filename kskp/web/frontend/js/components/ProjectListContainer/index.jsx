//@flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import projectListStyle from 'Shared/ListRow/ProjectListRow/style.scss'
import { APIUtil, ModalUtil } from 'Utils/index'
import { ProjectListHeader, ProjectListRow } from 'Shared/ListRow'
import { EmptyState, Loader } from 'Shared/Base'
import { Button, TextField } from 'Shared/Input'
import { ModalManager } from 'Shared/Modal'
import Constants from 'Constants/index'

import { ProjectInspector } from 'Shared/Inspector'
import {API} from 'Modules/api/index'
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
      selected_project: null
    }
  }

  componentWillMount() {
    API.GET.Navigation()
  }

  componentDidMount () {
    this.getProjectList()
    this.registerModal()
  }

  clearKeyword () {
    this.setState({
      keyword: '',
      selected_project: null
    })
    const target = document.querySelector('input[type=text]')
    if (target) target.value = ''
  }

  registerModal () {
    //モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_PROJECT, onClickDone: () => {
        APIUtil.post('projects', {name: this.state.project_name}).then((response) => {
          ModalUtil.emitModal(
            {id: Constants.modal.ADD_PROJECT, visible: false})
          this.clearKeyword()
          this.getProjectList()
        })
      },
    })
  }

  getProjectList () {
    this.setState({is_loading: true})
    APIUtil.get('projects').then((response) => {
      const json = response.data
      let selected_project = this.state.selected_project
      if (selected_project) {
        selected_project = json.data.find((project) => {
          return (project.uuid === selected_project.uuid)
        })
      }
      this.setState(
        {is_loading: false, is_finished: true, project_list: json.data, selected_project:selected_project}, () =>{
          this.forceUpdate()
        })
    })
  }

  renderProjectListHeader () {
    return <ProjectListHeader />
  }

  renderProjectList () {
    const {keyword} = this.state
    return this.state.project_list.filter((project) => {
      if (keyword === '') {
        return true
      }
      return (project.name.indexOf(keyword) != -1) ? true : false
    }).map((project) => {
      const selected = (this.state.selected_project === project)
      return <ProjectListRow key={project.uuid}
                          project={project}
                          href={'./flows?project=' + project.uuid}
                          selected={selected}
                          onClickProject={(e, project) => this.onClickProject(e, project)}>
      </ProjectListRow>
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
      <TextField placeholder={'プロジェクトを検索'} onChange={(e) => this.onChangeKeyword(e)} />
    </div>
  }

  onClickProject (e, project) {
    this.setState({selected_project: project})
  }

  onChangeKeyword (e) {
    this.setState({keyword: e.target.value})
  }

  onChangeProjectName (e) {
    this.setState({
      project_name: e.target.value,
    })
  }

  onBlurTitle (e, project) {
    if (project) {
      APIUtil.put('projects/' + project.uuid, {
        'new_name': e.target.value
      }).then((response) => {
        this.getProjectList()
      }, (error) => {

      })
    }
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
                     validation)} />
      </div>,
    })
  }

  onClickDelete (project_uuid) {
    ModalUtil.registerModal({
      id: Constants.modal.CONFIRM, onClickDone: () => {
        APIUtil.delete('projects/' + project_uuid).then((response) => {
          this.getProjectList()
          this.setState({selected_project: null})
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
        選択されたプロジェクトを削除しますか？
      </div>,
    })
  }

  isEmptyProjectList () {
    if (!this.state.is_finished) return false
    if (!Array.isArray(this.state.project_list) ||
      this.state.project_list.length === 0 || this.state.project_list ===
      null) {
      return true
    }
    return false
  }

  renderNewProject () {
    return <a className={classnames(projectListStyle.project, projectListStyle.new)} href="#"
              onClick={(e) => this.onClickNew(e)}>
      <div className={projectListStyle.project_list}>
        <div className={projectListStyle.name}>
          <i className={classnames('material-icons', [projectListStyle.icon])}>add_circle_outline</i>
          新しくプロジェクトを作成する
        </div>
      </div>
    </a>
  }

  renderInspector () {
    return <ProjectInspector project={this.state.selected_project}
                             onClickDelete={(uuid) => this.onClickDelete(uuid)}
                             onBlurTitle={(e, project) => this.onBlurTitle(e, project)} />
  }

  renderAll () {
    if (this.isEmptyProjectList()) {
      return this.renderEmptyState()
    }
    if (!this.state.is_finished) return null
    return <div>
      {this.renderSearchBar()}
      {this.renderProjectListHeader()}
      {this.renderProjectList()}
      {this.renderNewProject()}
      {this.renderInspector()}
    </div>
  }

  render () {
    return <div className={style.inspector_list_container}>
      <div className={'container mt-40px'}>
        <Loader absolute={true} visible={this.state.is_loading} />
        {this.renderAll()}
        <ModalManager />
      </div>
    </div>
  }

}