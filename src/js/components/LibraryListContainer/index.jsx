//@flow
import { connect } from 'react-redux'
import * as React from 'react'
import { addNotification, removeNotification, updateNotification } from 'reapop'
import Library from './Libary'

let LibraryContainer

export type LibraryProps = {
  notify: Function;
  updateNotify: Function;
  dismissNotify: Function;
}

export default LibraryContainer = connect(
  state => {
    return {
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
  },
)(Library)