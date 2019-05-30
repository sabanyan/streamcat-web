import { connect } from 'react-redux'
import FlowList from './FlowList'
import { addNotification, removeNotification, updateNotification } from 'reapop'
import { selectFlowAction, updateRunArgsAction, } from '../../modules/flowList'

let FlowListContainer

export type FlowListProps = {
  notify: Function;
  dissmissNotify: Function;
}

export default FlowListContainer = connect(
  state => {
    return {
      flow: state.flowListReducer.flow,
      runArgs: state.flowListReducer.runArgs
    }
  },
  dispatch => {
    return {
      selectFlow (...args) {
        return dispatch(selectFlowAction(...args))
      },
      updateRunArgs (...args) {
        return dispatch(updateRunArgsAction(...args))
      },
      notify (...args) {
        return dispatch(addNotification(...args))
      },
      updateNotify (...args) {
        return dispatch(updateNotification(...args))
      },
      dismissNotify (...args) {
        setTimeout(() => {
          dispatch(removeNotification(...args))
        }, 1000)
      },
    }
  }
)(FlowList)
