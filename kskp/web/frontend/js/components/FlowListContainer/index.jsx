import { connect } from 'react-redux'
import FlowList from 'FlowListContainer/FlowList'
import { addNotification, removeNotification, updateNotification } from 'reapop'
import { selectFlowAction, updateRunArgsAction, } from 'Modules/flowList'
import type { FlowModelProps } from "Model/Flow/FlowModel";
import type { RunArgsType } from "Types/index";

let FlowListContainer

export type FlowListProps = {
  notify: Function;
  updateNotify: Function;
  dismissNotify: Function;
  flow: FlowModelProps;
  runArgs: RunArgsType;
  selectFlow: Function;
  updateRunArgs: Function;
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
      selectFlow (flow) {
        return dispatch(selectFlowAction(flow))
      },
      updateRunArgs (runArgs) {
        return dispatch(updateRunArgsAction(runArgs))
      },
      notify (context:{}) {
        return dispatch(addNotification(context))
      },
      updateNotify (context:{}) {
        return dispatch(updateNotification(context))
      },
      dismissNotify (id:string) {
        setTimeout(() => {
          dispatch(removeNotification(id))
        }, 1000)
      },
    }
  }
)(FlowList)
