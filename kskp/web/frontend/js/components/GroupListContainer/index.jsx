import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import groupListStyle from 'Shared/ListRow/GroupListRow/style.scss'
import { APIUtil, ModalUtil } from 'Utils/index'
import { GroupListHeader, GroupListRow } from 'Shared/ListRow'
import { EmptyState, Loader } from 'Shared/Base'
import { Button, TextField } from 'Shared/Input'
import { ModalManager } from 'Shared/Modal'
import Constants from 'Constants/index'

import { GroupInspector } from 'Shared/Inspector'
/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

export default class GroupListContainer extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      groups: [],
      keyword: '',
      isLoading: false,
      finished: false,
      groupName: null,
      selectedGroup: null
    }
  }

  componentDidMount() {
    this.getGroupList()
    this.registerModal()
  }

  clearKeyword() {
    this.setState({
      keyword: '',
      selectedGroup: null
    })
    const target = document.querySelector('input[type=text]')
    if (target) target.value = ''
  }

  registerModal() {
    // モーダル処理の登録
    ModalUtil.registerModal({
      id: Constants.modal.ADD_GROUP, onClickDone: () => {
        console.log('before post groups', this.state.groupName)
        APIUtil.post('groups', {name: this.state.groupName}).then((response) => {
          console.log('post groups', response)
          ModalUtil.emitModal(
            {id: Constants.modal.ADD_GROUP, visible: false})
          this.clearKeyword()
          this.getGroupList()
        })
      },
    })
  }

  getGroupList() {
    // ロード状態にする
    this.setState({isLoading: true})

    APIUtil.get('groups').then((response) => {
      const json = response.data
      let selectedGroup = this.state.selectedGroup
      if (selectedGroup) {
        selectedGroup = json.data.find((group) => {
          return (group.id === selectedGroup.id)
        })
      }

      this.setState(
        {
          isLoading: false, 
          finished: true, 
          groups: json.data, 
          selectedGroup: selectedGroup
        },
        () => { this.forceUpdate() }
      )
    })
  }

  renderGroupListHeader() {
    return <GroupListHeader />
  }

  renderGroupList() {
    const {keyword} = this.state
    
    return this.state.groups.filter((group) => {
      if (keyword === '') {
        return true
      }
      return (group.name.indexOf(keyword) != -1) ? true : false
    }).map((group) => {      
      const selected = (this.state.selectedGroup === group)
      
      return <GroupListRow key={group.id}
                           group={group}
                           href={'./groups/' + group.id}
                           selected={selected}
                           onClickGroup={(e, group) => this.onClickGroup(e, group)} />
    })
  }

  renderEmptyState() {
    return <EmptyState
      icon={'add'}
      title={'グループがありません'}
      description={'グループが作成できます。'}>
      <Button onClick={(e) => this.onClickNew(e)}>作成する</Button>
    </EmptyState>
  }

  renderSearchBar () {
    return <div className={style.searchBar}>
      <TextField placeholder={'グループを検索'} onChange={(e) => this.onChangeKeyword(e)} />
    </div>
  }

  onClickGroup (e, group) {
    this.setState({selectedGroup: group})
  }

  onChangeKeyword (e) {
    this.setState({keyword: e.target.value})
  }

  onChangeGroupName (e) {
    this.setState({groupName: e.target.value})
  }

  onBlurTitle (e, group) {
    if (group) {
      APIUtil.put(
        'groups/' + group.id,
        { 'new_name': e.target.value }
      ).then(
        (response) => { this.getGroupList() },
        (error) => {}
      )
    }
  }

  onClickNew (e) {    
    ModalUtil.emitModal({
      id: Constants.modal.ADD_GROUP,
      visible: true,
      done: '作成する',
      content: <div>
        <TextField 
          rules={{
            required: true,
            minlength: 0,
          }}
          placeholder={'グループ名'}
          onChange={(e, validation) => this.onChangeGroupName(e, validation)}
        />
      </div>,
    })
  }

  onClickDelete (groupId) {
    console.log('groupId;', groupId)
    ModalUtil.registerModal(
      {
        id: Constants.modal.CONFIRM, 
        onClickDone: () => {
          APIUtil.delete('groups/' + groupId).then(
            (response) => {
              this.getGroupList()
              this.setState({selectedGroup: null})
              ModalUtil.closeModal(Constants.modal.CONFIRM)
            }
          )
        },
      }
    )
    ModalUtil.emitModal({
      id: Constants.modal.CONFIRM,
      visible: true,
      done: '削除する',
      danger: true,
      content: <div>
        選択されたグループを削除しますか？
      </div>,
    })
  }

  isEmptyGroupList () {
    if (!this.state.finished) return false
    if (!Array.isArray(this.state.groups) ||
        this.state.groups.length === 0 ||
        this.state.groups === null) {
      return true
    }
    return false
  }

  renderNewGroup () {
    return <a className={classnames(groupListStyle.group, groupListStyle.new)} href="#"
              onClick={(e) => this.onClickNew(e)}>
      <div className={groupListStyle.groupList}>
        <div className={groupListStyle.name}>
          <i className={classnames('material-icons', [groupListStyle.icon])}>add_circle_outline</i>
          新しくグループを作成する
        </div>
      </div>
    </a>
  }

  renderInspector () {    
    return <GroupInspector group={this.state.selectedGroup}
                           onClickDelete={(id) => this.onClickDelete(id)}
                           onBlurTitle={(e, group) => this.onBlurTitle(e, group)} />
  }

  renderAll () {
    if (this.isEmptyGroupList()) {
      return this.renderEmptyState()
    }
    if (!this.state.finished) return null

    return <div>
      {this.renderSearchBar()}
      {this.renderGroupListHeader()}
      {this.renderGroupList()}
      {this.renderNewGroup()}
      {this.renderInspector()}
    </div>
  }

  render () {
    return <div className={style.inspectorListContainer}>
      <div className={'container mt-40px'}>
        <Loader absolute={true} visible={this.state.isLoading} />
          {this.renderAll()}
        <ModalManager />
      </div>
    </div>
  }

}