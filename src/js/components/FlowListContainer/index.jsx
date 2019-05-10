import { connect } from 'react-redux'
import FlowList from './FlowList'
import { addNotification,updateNotification,removeNotification} from 'reapop';
import {
  selectFlowAction,
  updateRunArgsAction,
} from '../../modules/flowList'

let FlowListContainer

export type FlowListProps = {
  notify: Function;
  dissmissNotify: Function;
}

export default FlowListContainer = connect(
  state => {
    return {
      flow : state.flowListReducer.flow,
      runArgs : state.flowListReducer.runArgs
    }
  },
  dispatch => {
    return {
      selectFlow(...args){
        return dispatch(selectFlowAction(...args))
      },
      updateRunArgs(...args){
        return dispatch(updateRunArgsAction(...args))
      },
      notify(...args){
        return dispatch(addNotification(...args))
      },
      updateNotify(...args){
        return dispatch(updateNotification(...args))
      },
      dismissNotify(...args){
        setTimeout(()=>{
          dispatch(removeNotification(...args))
        },1000)
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

  //FIXIT: baseinpsectorのタイトル変更時、イベント処理
  onChangeTitle(e){
    this.state.selected_flow.label = e.target.value
    this.forceUpdate()
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

    const flow = this.state.selected_flow

    return <FlowInspector flow={this.state.selected_flow}
                          onClickDelete={(uuid)=>this.onClickDelete(uuid)}
                          onClickDuplicate={(uuid)=>this.onClickDuplicate(uuid)}
                          onBlurTitle={(e)=>this.onBlurTitle(e)}
                          onChangeTitle={(e)=>this.onChangeTitle(e)}/>
  }

  renderAll () {
    if (this.isEmptyFlowList()) {
      return this.renderEmptyState()
    }
  }
)(FlowList)
