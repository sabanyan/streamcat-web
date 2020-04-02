//@flow
import { connect } from 'react-redux'
import * as React from 'react'
import { addNotification, removeNotification, updateNotification } from 'reapop'
import Preview from 'PreviewContainer/Preview'

let PreviewContainer

export type PreviewProps = {
  notify: Function;
  updateNotify: Function;
  dismissNotify: Function;
}

export default PreviewContainer = connect(
  state => {
    return {}
  },
  dispatch => {
    return {
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
  },
)(Preview)
