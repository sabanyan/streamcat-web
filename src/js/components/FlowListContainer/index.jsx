import { connect } from 'react-redux'
import FlowList from './FlowList'
import { addNotification,updateNotification,removeNotification} from 'reapop';


let FlowListContainer

export type FlowListProps = {
  notify: Function;
  dissmissNotify: Function;
}

export default FlowListContainer = connect(
  state => {
    return {
      flow : state.reducer.flow
    }
  },
  dispatch => {
    return {
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
    }
  }
)(FlowList)
